# SignalForge — AI-native Marketing OS

> A mini CRM that helps a D2C brand decide **who** to talk to, **what** to say,
> and **which channel** to use — then runs the campaign and reports back live.

Built for the Xeno engineering take-home assignment.
The demo brand is a fictional D2C ethnic-wear label with 240 simulated shoppers
and realistic order histories. The platform itself is generic — it works for any
retail or D2C brand.

---

## The point of view

Most CRMs make the marketer do all the thinking: build a segment, write a
message, pick a channel, hit send. SignalForge inverts that.

The marketer states a **goal in plain English**. The product does the rest:

1. **Resolves the goal into an audience** — the AI translates intent like "win
   back customers who haven't ordered in 60 days" into a segment, and explains
   *why* each shopper was selected with a confidence score.
2. **Writes a personalised message per shopper** — not a blast, a message
   tailored to each person's name and top purchase category.
3. **Picks the best channel per shopper** — based on each customer's individual
   WhatsApp / Email / SMS affinity scores, or a fixed channel if preferred.
4. **Projects the outcome before launch** — a What-If simulator estimates reach
   and revenue per channel so the marketer commits with eyes open.
5. **Runs it and reports live** — the War Room streams every delivery event as
   it happens. When complete, the AI writes a plain-English performance insight.

This is less "a CRM with a chatbot bolted on" and more an **AI marketing
operating system** that thinks, decides, and acts.

---

## Architecture

Two services, exactly as the brief requires:

```
┌──────────────────────────────┐        ┌───────────────────────────────┐
│  CRM  (Next.js 14)           │        │  Channel Service  (Express)   │
│                              │        │  — a stubbed provider —       │
│  • React UI (App Router)     │ POST   │                               │
│  • API routes                │/dispatch  • Accepts a dispatch batch   │
│  • AI layer (multi-provider) │───────▶│  • Simulates full lifecycle   │
│  • Prisma ORM                │        │    with jittered async delays │
│  • SQLite (local)            │        │                               │
│  • Postgres (production)     │◀───────│  • Calls back per event:      │
│                              │callbacks  sent→delivered→read→clicked  │
│  POST /api/receipt           │        │  • Retries with backoff       │
│  GET  /api/.../stream (SSE)  │        │  • Idempotent on duplicates   │
└──────────────────────────────┘        └───────────────────────────────┘
```

The CRM never contacts a real messaging provider. The channel service simulates
one. The callback-driven loop between them — ordering, retries, idempotency — is
where the system-design thinking lives.

Full data model, lifecycle state machine, and scaling notes: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
Deployment guide (Railway + Render): [`DEPLOY.md`](./DEPLOY.md)

---

## Pages & features

| Page | What it does |
|---|---|
| **Command Center** `/` | AI morning brief — surfaces today's highest-value opportunities ranked by potential revenue. One click launches a campaign. |
| **Ingest** `/ingest` | Bring shoppers in via CSV upload, manual form, or the `POST /api/ingest` endpoint. Deduplicates by email. |
| **Shoppers** `/customers` | Full customer list. Click any shopper to open their AI **Digital Twin** — a generated personality profile with channel affinity scores. |
| **Audiences** `/audiences` | Auto-clusters shoppers into Champions, At Risk, Loyal, Newcomers and Dormant segments. Each launches a one-click campaign. |
| **New Campaign** `/campaigns/new` | The agentic core. Type a goal, get an audience + per-shopper messages + What-If projections. Launch when ready. |
| **War Room** `/campaigns` + `/campaigns/:id` | Live SSE feed of every delivery event. Funnel chart updates in real time. AI insight on completion. |
| **Analytics** `/analytics` | Revenue attribution across campaigns — from message to money. |
| **Learn** `/blog` | Six articles on retention, channels, attribution, AI-native marketing, personalisation and system design. |
| **Support** `/support` | Contact form, direct channels, response SLAs, and an FAQ for the brand's marketing team. |

---

## Run locally

**Prerequisites:** Node.js 18+ and npm. Two terminals.

### Terminal 1 — Channel Service

```bash
cd channel-service
npm install
npm run dev
# → 📡 Channel Service listening on :4000
```

### Terminal 2 — CRM

```bash
cd crm
npm install
npm run setup     # generates DB client, creates SQLite DB, seeds 240 shoppers
npm run dev
# → ready on http://localhost:3000
```

Open **http://localhost:3000**. The onboarding tour starts automatically on
first visit and explains every tab. Click **Restart tour** in the sidebar
to replay it.

### Enable real AI (free, no card needed)

The app runs fully on built-in heuristics with no key. To switch on genuine
AI-authored segments, messages, Digital Twins and insights:

1. Go to **https://aistudio.google.com** → click **Get API key**
2. Open `crm/.env` (copy from `crm/.env.example` if it doesn't exist)
3. Add your key:

```
GEMINI_API_KEY="your-key-here"
```

4. Restart the CRM (`Ctrl+C` then `npm run dev`)

The Command Center header switches to **"AI engine live"**.

The app also accepts `GROQ_API_KEY` (groq.com — free) or `ANTHROPIC_API_KEY`
as alternatives. It picks the first key it finds in that order.

### See the full loop in 60 seconds

1. **Command Center** — click any opportunity card
2. **New Campaign** — click "Build campaign", then "Launch"
3. **War Room** — watch live events stream in for ~20 seconds
4. **Analytics** — now has real revenue numbers

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + API | Next.js 14 (App Router) | One language, one deploy; API routes are the backend |
| Database | Prisma + SQLite → Postgres | Zero-setup locally; `provider = "postgresql"` for prod |
| AI | Gemini / Groq / Anthropic | Auto-selected by key; heuristic fallback if none set |
| Real-time | Server-Sent Events | One-directional push; no extra infra or handshake needed |
| Channel service | Express (standalone) | A genuinely separate process, as the brief requires |
| Animations | Framer Motion + Canvas | Onboarding tour, War Room feed, ambient network background |
| UI | Tailwind CSS | Custom dark/light design system; no component-kit defaults |

---

## What I chose NOT to build

- **Auth / multi-tenant** — out of scope for demonstrating the core loop.
- **A real message broker** — SSE + DB polling is honest for this scale. The
  scaling section in ARCHITECTURE.md explains the Redis Streams path.
- **Manual segment filter UI** — the point is letting AI do the segmentation.
- **Fake "self-improving" or "agent debate" features** — they look impressive in
  a screenshot and fall apart under any questioning. Fewer real things beat more
  fake ones.

---

## Repo layout

```
xeno-mco/
├── crm/                          # Next.js 14 app
│   ├── prisma/
│   │   ├── schema.prisma         # data model (5 tables)
│   │   └── seed.ts               # 240 simulated shoppers
│   ├── public/
│   │   └── sample-customers.csv  # downloadable sample for CSV import
│   └── src/
│       ├── app/
│       │   ├── page.tsx           # Command Center (homepage)
│       │   ├── ingest/            # CSV + manual + API ingestion
│       │   ├── customers/         # Shoppers list + Digital Twin
│       │   ├── audiences/         # Auto-segmentation explorer
│       │   ├── campaigns/
│       │   │   ├── new/           # Campaign builder (the agentic core)
│       │   │   └── [id]/          # War Room (live SSE feed)
│       │   ├── analytics/         # Revenue attribution
│       │   ├── blog/              # Learn tab + article reader
│       │   ├── support/           # Help & contact
│       │   └── api/               # All API routes
│       │       ├── brief/         # CMO morning brief
│       │       ├── customers/     # Customer list + Digital Twin generation
│       │       ├── campaigns/     # Segment, simulate, launch, stream
│       │       ├── audiences/     # Auto-clustering
│       │       ├── ingest/        # CSV + JSON ingestion endpoint
│       │       ├── receipt/       # Channel service callback sink
│       │       └── critique/      # AI message critic
│       ├── components/
│       │   ├── Sidebar.tsx        # Nav + theme toggle + tour restart
│       │   ├── NetworkBackground.tsx  # Ambient canvas animation
│       │   ├── ThemeProvider.tsx  # Light/dark theme context
│       │   └── OnboardingTour.tsx # First-visit guided walkthrough
│       └── lib/
│           ├── ai.ts              # Multi-provider AI layer (Gemini/Groq/Anthropic)
│           ├── prisma.ts          # DB client singleton
│           ├── helpers.ts         # Segment execution, enrichment, explainability
│           ├── format.ts          # Currency, channel metadata, event colours
│           └── blogs.ts           # Blog content (6 articles)
├── channel-service/
│   └── src/index.js              # Stubbed messaging provider with full lifecycle sim
├── ARCHITECTURE.md               # Data model, lifecycle, scaling tradeoffs
├── DEPLOY.md                     # Railway + Render deployment guide
└── start.sh                      # One-shot launcher for both services
```
