#!/usr/bin/env bash
# ============================================================
#  Aarava — one-shot local launcher
#  Installs deps, sets up the DB, and starts both services.
#  Use this for a quick local run. For real work, prefer the
#  two-terminal flow in README.md so you see each service's logs.
# ============================================================
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "▶ Installing channel service…"
cd "$ROOT/channel-service" && npm install

echo "▶ Installing CRM + setting up database…"
cd "$ROOT/crm" && npm install && npm run setup

echo ""
echo "✅ Setup complete. Starting both services…"
echo "   CRM:     http://localhost:3000"
echo "   Channel: http://localhost:4000"
echo ""

# Start channel service in the background, CRM in the foreground.
cd "$ROOT/channel-service" && npm run dev &
CHANNEL_PID=$!
trap "kill $CHANNEL_PID 2>/dev/null" EXIT

cd "$ROOT/crm" && npm run dev
