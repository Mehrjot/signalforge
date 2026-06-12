# Deployment Guide

You'll deploy **two services**: the CRM and the Channel Service. The recommended
host is **Railway** (simplest for two services + a Postgres DB). A Render path is
included too.

The only real wiring you must get right: the two services need to know each
other's public URLs.

- The CRM needs `CHANNEL_SERVICE_URL` → the channel service's public URL.
- The channel service is told the CRM's callback URL **per request** by the CRM,
  so the CRM also needs to know its **own** public URL via `CRM_PUBLIC_URL`.

---

## Option A — Railway (recommended)

### 1. Push to GitHub

```bash
cd xeno-mco
git init
git add .
git commit -m "Aarava — AI-native Marketing OS"
# create a repo on GitHub, then:
git remote add origin https://github.com/<you>/xeno-mco.git
git push -u origin main
```

### 2. Create the Channel Service

1. On Railway: **New Project → Deploy from GitHub repo** → pick your repo.
2. In the service settings set **Root Directory** to `channel-service`.
3. Railway auto-detects Node and runs `npm start`.
4. Under **Settings → Networking**, click **Generate Domain**. Copy the URL,
   e.g. `https://aarava-channel.up.railway.app`.

### 3. Add Postgres

In the same project: **New → Database → PostgreSQL**. Railway creates a
`DATABASE_URL` you'll reference next.

### 4. Switch the schema to Postgres

In `crm/prisma/schema.prisma`, change the datasource provider:

```prisma
datasource db {
  provider = "postgresql"   // was "sqlite"
  url      = env("DATABASE_URL")
}
```

Commit and push.

### 5. Create the CRM service

1. **New → GitHub repo** (same repo) → set **Root Directory** to `crm`.
2. **Variables** — add:
   - `DATABASE_URL` → reference the Postgres one (Railway: `${{Postgres.DATABASE_URL}}`)
   - `CHANNEL_SERVICE_URL` → the channel service domain from step 2
   - `CRM_PUBLIC_URL` → this CRM service's own public domain (generate it first
     under Networking, then paste it here)
   - `ANTHROPIC_API_KEY` → optional, enables real AI
3. The CRM's `build` script already runs `prisma generate && prisma migrate deploy`,
   so the schema is applied automatically on deploy.

### 6. Seed production data (once)

From your laptop, pointed at the prod DB:

```bash
cd crm
DATABASE_URL="<prod-postgres-url>" npm run db:seed
```

(Or temporarily add a one-off seed step; the simplest is running it locally
against the prod URL as above.)

### 7. Open the CRM domain — done.

---

## Option B — Render

1. **New → Web Service** from your repo, root `channel-service`, start command
   `npm start`. Note its URL.
2. **New → PostgreSQL**. Copy the internal connection string.
3. Switch `schema.prisma` provider to `postgresql` (as in A.4), push.
4. **New → Web Service** from the repo, root `crm`,
   build command `npm run build`, start command `npm start`.
5. Add the same env vars as A.5 (`DATABASE_URL`, `CHANNEL_SERVICE_URL`,
   `CRM_PUBLIC_URL`, optional `ANTHROPIC_API_KEY`).
6. Seed once (A.6).

---

## Sanity checks after deploy

- Visit `https://<channel-service>/health` → `{"status":"ok"}`.
- Open the CRM, launch a campaign, and confirm the War Room shows live events.
  If events never arrive, the callback URL is wrong — re-check `CRM_PUBLIC_URL`
  matches the CRM's actual public domain (no trailing slash).

---

## Common gotchas

- **SSE behind a proxy.** Some hosts buffer responses and break SSE. Railway and
  Render stream fine. If events lag, confirm the response keeps
  `Cache-Control: no-cache, no-transform` (it does by default here).
- **Trailing slashes.** `CRM_PUBLIC_URL=https://x.app` not `.../`. The callback
  path is appended as `/api/receipt`.
- **Free tier cold starts.** A sleeping channel service may miss the first
  dispatch. Hit `/health` once to wake it before demoing, or use a paid tier for
  the recording.
