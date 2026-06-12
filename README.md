# Aarava — an AI-native Marketing OS

> A mini CRM that helps a consumer brand decide **who** to talk to, **what** to
> say, and **which channel** to reach them on — then runs the campaign and
> reports back, in real time.

Built for the Xeno engineering take-home. The demo brand is **Aarava**, a
fictional D2C ethnic-wear label, with 60 fully-simulated shoppers and their
order histories.

---

## The point of view

Most CRMs make a marketer do the thinking: build a segment, write a message,
pick a channel, hit send. Aarava inverts that. The marketer states a **goal in
plain English**, and the product does the reasoning:

1. **Resolves the goal into an audience** — translates "win back customers who
   haven't ordered in 60 days" into an executable segment, and explains *why*
   each shopper was chosen.
2. **Writes a personalised message per shopper** — not one blast, a message
   tailored to each person's name and favourite category.
3. **Picks the channel** — per-shopper, based on each customer's channel
   affinity, or a fixed channel if the marketer prefers.
4. **Projects the outcome before launch** — a What-If simulator estimates reach
   and revenue per channel so the marketer commits with eyes open.
5. **Runs it and reports live** — a War Room streams every delivery event as it
   happens, then an AI writes a plain-English performance insight.

The framing is deliberate: this is less "a CRM with a chatbot bolted on" and
more **an AI marketing operating system** that thinks, decides, and acts.

---

## Architecture at a glance

Two services, exactly as the brief asks:

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│   CRM  (Next.js 14)          │         │   Channel Service (Express)  │
│                              │         │   — a stubbed provider —     │
│  • UI (App Router, React)    │         │                              │
│  • API routes                │ POST    │  • Accepts a dispatch batch  │
│  • AI layer (Claude)         │ /dispatch│  • Simulates the full        │
│  • Prisma + SQLite/Postgres  │────────▶│    lifecycle async, with     │
│                              │         │    realistic delays          │
│  /api/receipt  ◀─────────────│─────────│  • Calls back per event      │
│  (callback sink)             │ callbacks│    (sent→delivered→read→     │
│                              │         │     clicked→converted/failed)│
│  /api/.../stream (SSE)       │         │  • Retries failed callbacks  │
└─────────────────────────────┘         │    with exponential backoff  │
                                         └──────────────────────────────┘
```

The CRM **never** talks to a real messaging provider. The channel service
simulates one, and the callback-driven loop is where the interesting
system-design lives (ordering, failures, retries, idempotency).

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full data model, the
lifecycle state machine, and the scaling notes.

---

## Run it on your laptop

**Prerequisites:** Node.js 18+ (20+ recommended) and npm.

You need **two terminals** — one per service.

### Terminal 1 — the Channel Service

```bash
cd channel-service
npm install
npm run dev
# → 📡 Channel Service listening on :4000
```

### Terminal 2 — the CRM

```bash
cd crm
npm install
npm run setup     # generates the DB client, creates the SQLite DB, seeds 60 shoppers
npm run dev
# → ready on http://localhost:3000
```

Open **http://localhost:3000**.

> **AI works without a key.** With no key set, every "intelligent" feature runs
> on built-in heuristics, so the product is fully usable and the demo never
> breaks. To enable genuine AI-authored segments, messages, twins and insights,
> copy `crm/.env.example` to `crm/.env` and add **one** key. The app picks the
> first it finds, in this order: Gemini, Groq, Anthropic.
>
> **Recommended — free, no card:** Google Gemini. Get a key at
> https://aistudio.google.com → "Get API key", then:
>
> ```
> GEMINI_API_KEY="your-gemini-key"
> ```
>
> The header on the Command Center shows which mode you're in
> ("AI engine live" vs "Heuristic mode").

### A 60-second tour

1. **Command Center** (`/`) — the AI CMO's morning brief. Click an opportunity.
2. It drops you in **New Campaign** with the goal pre-filled. Watch it build the
   audience (with per-shopper reasoning) and run the What-If simulator.
3. Hit **Launch**. You're taken to the **War Room** — watch live events stream in
   as the channel service reports back. When it completes, read the AI insight.
4. **Shoppers** (`/customers`) — click any shopper to open their **Digital Twin**.
5. **Audiences** (`/audiences`) — shoppers auto-grouped into behavioural segments.
6. **Analytics** (`/analytics`) — revenue attribution across campaigns.
7. **Learn** (`/blog`) — field-guide articles on the thinking behind the product.

Use the **light/dark toggle** at the bottom of the sidebar to switch themes.

---

## Tech choices

| Layer            | Choice                    | Why                                                       |
| ---------------- | ------------------------- | --------------------------------------------------------- |
| Frontend + API   | Next.js 14 (App Router)   | One language, one deploy; API routes give us the backend  |
| Database         | Prisma + SQLite → Postgres| Zero-setup locally; one-line switch to Postgres in prod   |
| AI               | Gemini / Groq / Anthropic | Auto-selected by key; structured JSON, heuristic fallback |
| Real-time        | Server-Sent Events        | Simplest reliable push for the War Room; no extra infra   |
| Channel service  | Express (standalone)      | A genuinely separate process, as the brief requires       |
| UI               | Tailwind + Framer Motion  | Custom "Mission Control" design system, no UI-kit look     |

---

## What I consciously did **not** build

- **Auth / multi-tenant** — out of scope for demonstrating the core loop.
- **A real message broker** — SSE + DB polling is honest for this scale; the
  scaling section explains the Redis Streams / queue path.
- **Hand-built segment SQL builder UI** — the goal is to let AI do the
  segmentation, not rebuild a filter GUI.
- **The "agent debate" / "self-improving" gimmicks** — they look impressive in a
  screenshot but don't hold up to questioning, and a fake learning loop is worse
  than none. I'd rather ship fewer things that are real.

---

## Repo layout

```
xeno-mco/
├── crm/                      # Next.js app (CRM + API + UI)
│   ├── prisma/
│   │   ├── schema.prisma     # the data model
│   │   └── seed.ts           # 60 simulated shoppers
│   └── src/
│       ├── app/              # pages + API routes
│       ├── components/       # Sidebar, NetworkBackground
│       └── lib/              # ai.ts, prisma.ts, helpers.ts, format.ts
├── channel-service/          # the stubbed messaging provider
│   └── src/index.js
├── ARCHITECTURE.md           # data model, lifecycle, scaling
└── DEPLOY.md                 # Railway / Render deployment guide
```
