# Architecture

This document covers the data model, the communication lifecycle, the
callback-driven loop, and how each part would change at scale. It's written to
be the thing you read before reviewing the code.

---

## 1. Data model

Five tables. The design principle: keep aggregate counters **denormalised** on
`Campaign` and `Customer` so the dashboards read fast, and keep an
**append-only** event log so the War Room and attribution are auditable.

```
Customer ──< Order
   │
   └──< Communication >── Campaign
              │
              └──< CommEvent   (append-only lifecycle log)
```

**Customer** — a shopper. Carries denormalised lifetime metrics (`totalSpend`,
`orderCount`, `lastOrderAt`) plus per-channel **affinity scores** (0–100) that
drive channel selection, and the AI **Digital Twin** (`twinSummary`,
`twinTraits`).

**Order** — a purchase. An order created by a campaign carries
`attributedCommunicationId`, which is how revenue attribution is traced.

**Campaign** — a goal + chosen audience + message template. Holds the AI's
segmentation `reason` (for explainability), the What-If `simulation` snapshot,
aggregate engagement counters, and the final AI `insight`.

**Communication** — one message to one shopper: the unit the channel service
operates on. Holds the personalised `message`, the `selectionReason` and
`confidence` (explainability), per-event timestamps, and `retryCount`.

**CommEvent** — append-only log of every lifecycle event. This is the source of
truth that powers the live feed and lets us recompute stats if a counter ever
drifts.

---

## 2. The communication lifecycle

Each message moves through a funnel. Not every message reaches the end — drop-off
at each stage is what makes the simulation realistic.

```
            ┌──────────┐
queued ───▶ │   sent   │
            └────┬─────┘
                 ▼
           ┌───────────┐      (a slice fail outright at any point)
           │ delivered │ ─────────────────────────┐
           └────┬──────┘                           ▼
                ▼                              ┌────────┐
            ┌────────┐                         │ failed │
            │ opened │                         └────────┘
            └───┬────┘
                ▼
             ┌──────┐
             │ read │
             └──┬───┘
                ▼
           ┌─────────┐
           │ clicked │
           └────┬────┘
                ▼
          ┌───────────┐
          │ converted │  → creates an attributed Order + revenue
          └───────────┘
```

Channel matters: WhatsApp has the highest open/click/convert rates in the
simulation, email the lowest open rate, SMS in between. These probabilities live
in `channel-service/src/index.js` (`FUNNEL`).

---

## 3. The callback-driven loop (the heart of the brief)

This is the part the assignment specifically calls out, so here's exactly how it
works and what tradeoffs were made.

**Dispatch (CRM → Channel Service).** On launch, the CRM creates all
`Communication` rows, then POSTs the batch to the channel service's `/dispatch`
with a `callbackUrl`. The channel service **accepts immediately** (like a real
provider returning a 202) and processes asynchronously — the CRM does not block
on delivery.

**Simulation (inside the Channel Service).** For each message it schedules a
chain of `setTimeout`s with **jittered delays** (so events arrive interleaved and
out-of-lockstep, like reality). At each funnel stage it rolls against the
channel's probability and either advances or stops.

**Callbacks (Channel Service → CRM).** Every event is POSTed back to
`/api/receipt`. The CRM:

1. Appends to `CommEvent` (the log).
2. Advances the `Communication.status` and sets the event timestamp.
3. Increments the matching aggregate counter on `Campaign`.
4. On `converted`, creates an attributed `Order` and bumps the customer's
   lifetime stats.
5. Checks whether the campaign is complete (≥90% of messages terminal) and, if
   so, generates the AI insight.

**The three things the brief is really testing:**

- **Ordering.** Events for a single message are emitted in funnel order by
  construction (each stage's delay is added to a running total). Across messages,
  order is intentionally interleaved.
- **Failures + retries.** If a callback POST fails (CRM down, network blip), the
  channel service retries with **exponential backoff** (0.5s → 1s → 2s → 4s, up to
  5 attempts) before dropping it. This gives **at-least-once** delivery.
- **Idempotency.** Because delivery is at-least-once, the CRM must tolerate
  duplicates. `/api/receipt` checks the `CommEvent` log and **no-ops on a repeat**
  of the same event for the same communication, so a retried callback can't
  double-count a stat.

---

## 4. Real-time delivery to the UI

The War Room subscribes via **Server-Sent Events** (`/api/campaigns/:id/stream`).
The endpoint polls the `CommEvent` log every second for rows newer than the last
it saw, pushes them, and also pushes a fresh aggregate snapshot each tick. When
the campaign completes it emits a final event and closes.

SSE (not WebSockets) because the data flow is one-directional (server → client)
and SSE needs no extra library or handshake. Polling the log (not a pub/sub bus)
because at this scale it's simple and correct; see scaling below.

---

## 5. The AI layer

Everything "intelligent" routes through `crm/src/lib/ai.ts`. Two deliberate
properties:

- **Graceful degradation.** If `ANTHROPIC_API_KEY` is absent, every function
  falls back to a deterministic heuristic. The product is fully functional with
  zero secrets — important so a reviewer can clone and run, and so a live demo
  can't be broken by a flaky API call.
- **Structured output.** Claude is prompted to return JSON; a tolerant parser
  (`extractJson`) strips fences and pulls the first JSON value, falling back to
  the heuristic if parsing fails. Prompts live next to their parsers so they
  evolve together.

Capabilities: goal→segment, per-customer message generation, the message critic
(AI evaluating AI), channel simulation, the Digital Twin, and the post-campaign
insight.

---

## 6. Scale assumptions & what changes

**Current scope:** single brand, ~60 shoppers, campaigns of tens-to-hundreds of
messages, one app instance. Every choice below is honest about that.

| Concern | Now (this scope) | At scale |
| --- | --- | --- |
| **Message generation** | Sequential AI calls at launch | Batch + a job queue (BullMQ/SQS); generate in workers, rate-limit the AI |
| **Dispatch** | One HTTP POST with the full batch | Chunk into pages; the channel service pulls from a queue |
| **Callback ingestion** | Direct writes to SQLite | A queue in front of `/api/receipt`; workers write in batches |
| **Real-time feed** | SSE polling the event log every 1s | Redis Streams / a broker; fan-out to many viewers without DB load |
| **Counters** | `increment` on the row | Risk of write contention → move to Redis counters or periodic rollups from the event log |
| **Idempotency** | Lookup in `CommEvent` per event | A dedicated dedupe key (e.g. `commId:event`) with a unique index |
| **DB** | SQLite file | Postgres (one-line provider switch in `schema.prisma`) with read replicas |
| **Completion detection** | 90%-terminal heuristic on each callback | An explicit timeout + reconciliation job |

The single most important scaling change is putting a **durable queue** between
the two services in both directions. That turns the current fire-and-forget HTTP
calls into a backpressure-aware, retryable pipeline — which is what a real
channel integration looks like.
