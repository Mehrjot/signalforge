import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInsight } from "@/lib/ai";

export const dynamic = "force-dynamic";

// POST /api/receipt
//   { communicationId, campaignId, event, at, detail? }
//
// The Channel Service calls this asynchronously for every lifecycle
// event. We:
//   1. Append to the event log (drives the War Room feed).
//   2. Advance the communication's status + timestamp.
//   3. Update campaign aggregate counters.
//   4. On "converted", create an attributed order + revenue.
//   5. When all comms are terminal, generate the AI insight.
//
// Idempotency: we no-op if the event was already recorded, so retries
// from the channel service are safe (at-least-once delivery).
const EVENT_FIELD: Record<string, string> = {
  sent: "sentAt",
  delivered: "deliveredAt",
  opened: "openedAt",
  read: "readAt",
  clicked: "clickedAt",
  failed: "failedAt",
};

const COUNTER: Record<string, string> = {
  sent: "sentCount",
  delivered: "deliveredCount",
  opened: "openedCount",
  read: "readCount",
  clicked: "clickedCount",
  failed: "failedCount",
};

export async function POST(req: Request) {
  const body = await req.json();
  const { communicationId, campaignId, event, detail } = body;
  const at = body.at ? new Date(body.at) : new Date();

  const comm = await prisma.communication.findUnique({ where: { id: communicationId } });
  if (!comm) return NextResponse.json({ error: "Unknown communication" }, { status: 404 });

  // Idempotency guard: skip duplicate lifecycle events.
  const existing = await prisma.commEvent.findFirst({
    where: { communicationId, type: event },
  });
  if (existing && event !== "converted") {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  // 1. Log the event.
  await prisma.commEvent.create({
    data: { communicationId, type: event, detail: detail ?? null, at },
  });

  // 2 & 3. Advance comm + campaign counters.
  if (event === "converted") {
    await handleConversion(comm, campaignId, at);
  } else {
    const field = EVENT_FIELD[event];
    const counter = COUNTER[event];
    if (field) {
      await prisma.communication.update({
        where: { id: communicationId },
        data: {
          status: event,
          [field]: at,
          ...(event === "failed" ? { failReason: detail ?? "delivery failed" } : {}),
        },
      });
    }
    if (counter) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { [counter]: { increment: 1 } },
      });
    }
  }

  // 5. Check for completion.
  await maybeComplete(campaignId);

  return NextResponse.json({ ok: true });
}

async function handleConversion(comm: any, campaignId: string, at: Date) {
  // Attribute an order to this communication (purchase within the window).
  const customer = await prisma.customer.findUnique({ where: { id: comm.customerId } });
  if (!customer) return;
  const avgOrderValue = customer.orderCount ? customer.totalSpend / customer.orderCount : 1500;
  const amount = Math.round(avgOrderValue * (0.8 + Math.random() * 0.6));

  await prisma.order.create({
    data: {
      customerId: comm.customerId,
      category: "Campaign Order",
      items: JSON.stringify(["Reorder"]),
      amount,
      placedAt: at,
      attributedCommunicationId: comm.id,
    },
  });
  await prisma.customer.update({
    where: { id: comm.customerId },
    data: {
      totalSpend: { increment: amount },
      orderCount: { increment: 1 },
      lastOrderAt: at,
    },
  });
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      attributedOrders: { increment: 1 },
      attributedRevenue: { increment: amount },
    },
  });
}

async function maybeComplete(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.status === "completed") return;

  // A comm is "terminal" once it has clicked, read (without click), or failed.
  const comms = await prisma.communication.findMany({
    where: { campaignId },
    select: { status: true },
  });
  const terminal = comms.filter((c: any) =>
    ["clicked", "read", "failed"].includes(c.status)
  ).length;

  // Heuristic: consider complete when >=90% reached a terminal-ish state.
  if (comms.length > 0 && terminal / comms.length >= 0.9) {
    const insight = await generateInsight({
      name: campaign.name,
      channel: campaign.channel,
      sent: campaign.sentCount,
      delivered: campaign.deliveredCount,
      read: campaign.readCount,
      clicked: campaign.clickedCount,
      attributedOrders: campaign.attributedOrders,
      attributedRevenue: campaign.attributedRevenue,
    });
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "completed", completedAt: new Date(), insight },
    });
  }
}
