import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { goalToSegment, generateMessage, simulateChannels } from "@/lib/ai";
import {
  runSegment,
  bestChannel,
  selectionReason,
  confidenceFor,
  CHANNEL_SERVICE_URL,
  CRM_PUBLIC_URL,
} from "@/lib/helpers";

export const dynamic = "force-dynamic";

// POST /api/campaigns/launch { goal, name, channel }
//   channel = "whatsapp" | "email" | "sms" | "smart"
//
// This is the orchestration core:
//   1. AI resolves the goal -> segment, we execute it -> audience.
//   2. For each customer we pick a channel (or honour the chosen one),
//      generate a personalised message, and persist a Communication.
//   3. We hand the whole batch to the stubbed Channel Service, which
//      will asynchronously call our /api/receipt endpoint back.
export async function POST(req: Request) {
  const { goal, name, channel = "smart" } = await req.json();
  if (!goal) return NextResponse.json({ error: "Goal required" }, { status: 400 });

  const categories = [...new Set<string>((await prisma.order.findMany({ select: { category: true } })).map((o: { category: string }) => o.category))];
  const cities = [...new Set<string>((await prisma.customer.findMany({ select: { city: true } })).map((c: { city: string }) => c.city))];

  const spec = await goalToSegment(goal, categories, cities);
  const audience = await runSegment(spec);
  if (audience.length === 0)
    return NextResponse.json({ error: "No customers match this goal." }, { status: 400 });

  const sim = await simulateChannels(audience, goal);

  // Create the campaign shell.
  const campaign = await prisma.campaign.create({
    data: {
      name: name || spec.name,
      goalText: goal,
      status: "launching",
      channel,
      segmentReason: spec.reason,
      simulation: JSON.stringify(sim),
      audienceSize: audience.length,
      launchedAt: new Date(),
    },
  });

  // Build personalised communications (sequential to keep AI calls polite;
  // for large audiences we'd batch + queue — see README scaling notes).
  const jobs: { id: string; channel: string; message: string; recipient: string }[] = [];
  for (const c of audience) {
    const ch = channel === "smart" ? bestChannel(c) : channel;
    const message = await generateMessage(goal, ch, {
      name: c.name,
      topCategory: c.topCategory,
      city: c.city,
    });
    const comm = await prisma.communication.create({
      data: {
        campaignId: campaign.id,
        customerId: c.id,
        channel: ch,
        message,
        status: "queued",
        selectionReason: selectionReason(c),
        confidence: confidenceFor(c),
      },
    });
    jobs.push({ id: comm.id, channel: ch, message, recipient: c.name });
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "live" },
  });

  // Hand off to the Channel Service. It will POST back to /api/receipt.
  // Fire-and-forget: we don't await delivery, only the accept.
  fetch(`${CHANNEL_SERVICE_URL}/dispatch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaignId: campaign.id,
      callbackUrl: `${CRM_PUBLIC_URL}/api/receipt`,
      jobs,
    }),
  }).catch((err) => console.error("Channel dispatch failed:", err.message));

  return NextResponse.json({ campaignId: campaign.id, audienceSize: audience.length });
}
