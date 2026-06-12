// ============================================================
//  Xeno Channel Service (stub)
//
//  A deliberately separate microservice that simulates a real
//  messaging provider (WhatsApp/SMS/Email/RCS). It NEVER delivers
//  anything. Instead it models the full lifecycle of each message
//  and calls back into the CRM's /api/receipt endpoint with what
//  "happened".
//
//  What we model on purpose (this is what the brief is testing):
//    - ASYNC delivery with realistic, jittered delays.
//    - A probabilistic funnel: sent -> delivered -> opened -> read
//      -> clicked -> converted, where each stage can drop off.
//    - FAILURES: a slice of messages fail outright.
//    - CHANNEL DIFFERENCES: WhatsApp converts better than SMS/Email.
//    - RETRIES with exponential backoff if the callback POST fails,
//      so the CRM (at-least-once) eventually gets every event.
//    - ORDERING: events for one message are emitted in funnel order.
// ============================================================

import express from "express";

const app = express();
app.use(express.json({ limit: "5mb" }));

const PORT = process.env.PORT || 4000;

// Per-channel funnel probabilities. Each is P(advance | reached prev stage).
const FUNNEL = {
  whatsapp: { delivered: 0.97, opened: 0.85, read: 0.92, clicked: 0.42, converted: 0.28, fail: 0.03 },
  email: { delivered: 0.95, opened: 0.38, read: 0.80, clicked: 0.22, converted: 0.12, fail: 0.05 },
  sms: { delivered: 0.94, opened: 0.55, read: 0.88, clicked: 0.18, converted: 0.10, fail: 0.06 },
  rcs: { delivered: 0.96, opened: 0.70, read: 0.90, clicked: 0.30, converted: 0.18, fail: 0.04 },
};

function jitter(baseMs, spread) {
  return baseMs + Math.floor(Math.random() * spread);
}

// Deliver one callback with retry + exponential backoff.
async function postCallback(callbackUrl, payload, attempt = 0) {
  try {
    const res = await fetch(callbackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
  } catch (err) {
    if (attempt >= 4) {
      console.error(`[channel] callback dropped after ${attempt} retries:`, payload.event);
      return;
    }
    const backoff = Math.pow(2, attempt) * 500; // 0.5s, 1s, 2s, 4s...
    console.warn(`[channel] callback retry ${attempt + 1} in ${backoff}ms (${payload.event})`);
    setTimeout(() => postCallback(callbackUrl, payload, attempt + 1), backoff);
  }
}

// Simulate the full lifecycle of one message.
function simulateMessage(job, campaignId, callbackUrl) {
  const probs = FUNNEL[job.channel] || FUNNEL.whatsapp;
  let delay = jitter(800, 2500);

  function emit(event, extraDelay, detail) {
    delay += extraDelay;
    setTimeout(() => {
      postCallback(callbackUrl, {
        communicationId: job.id,
        campaignId,
        event,
        at: new Date().toISOString(),
        detail,
      });
    }, delay);
  }

  // Outright failure?
  if (Math.random() < probs.fail) {
    emit("failed", jitter(500, 1500), "Carrier rejected / unreachable");
    return;
  }

  emit("sent", 0);
  if (Math.random() > probs.delivered) return; // stuck after send
  emit("delivered", jitter(1000, 3000));

  if (Math.random() > probs.opened) return;
  emit("opened", jitter(2000, 6000));

  if (Math.random() > probs.read) return;
  emit("read", jitter(1500, 4000));

  if (Math.random() > probs.clicked) return;
  emit("clicked", jitter(2000, 7000));

  if (Math.random() > probs.converted) return;
  emit("converted", jitter(4000, 15000), "Purchase within 24h window");
}

// POST /dispatch  { campaignId, callbackUrl, jobs: [{id, channel, message, recipient}] }
app.post("/dispatch", (req, res) => {
  const { campaignId, callbackUrl, jobs } = req.body;
  if (!campaignId || !callbackUrl || !Array.isArray(jobs)) {
    return res.status(400).json({ error: "campaignId, callbackUrl, jobs required" });
  }
  console.log(`[channel] accepted ${jobs.length} messages for campaign ${campaignId}`);

  // Accept immediately (like a real provider), then process async.
  for (const job of jobs) {
    simulateMessage(job, campaignId, callbackUrl);
  }
  res.json({ accepted: jobs.length, campaignId });
});

app.get("/health", (_req, res) => res.json({ status: "ok", service: "channel" }));

app.listen(PORT, () => {
  console.log(`📡 Channel Service listening on :${PORT}`);
});
