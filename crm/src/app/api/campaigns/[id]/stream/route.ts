import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/campaigns/:id/stream  -> Server-Sent Events of live lifecycle events.
//
// We poll the append-only CommEvent log and push anything new to the client.
// Polling (vs. a pub/sub bus) keeps the demo dependency-free; the README
// explains how this becomes Redis Streams / a message broker at scale.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const campaignId = params.id;
  const encoder = new TextEncoder();
  let lastSeen = new Date(0);
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: unknown) {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      // Initial snapshot of campaign aggregates.
      const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
      send({ type: "snapshot", campaign });

      const interval = setInterval(async () => {
        if (closed) return;
        try {
          const events = await prisma.commEvent.findMany({
            where: {
              at: { gt: lastSeen },
              communication: { campaignId },
            },
            include: {
              communication: {
                include: { customer: { select: { name: true } } },
              },
            },
            orderBy: { at: "asc" },
            take: 50,
          });

          for (const e of events) {
            lastSeen = e.at > lastSeen ? e.at : lastSeen;
            send({
              type: "event",
              event: e.type,
              customer: e.communication.customer.name,
              channel: e.communication.channel,
              at: e.at,
              detail: e.detail,
            });
          }

          // Push updated aggregates each tick.
          const c = await prisma.campaign.findUnique({ where: { id: campaignId } });
          send({ type: "stats", campaign: c });

          if (c?.status === "completed") {
            send({ type: "completed", campaign: c });
            clearInterval(interval);
            closed = true;
            controller.close();
          }
        } catch {
          // swallow — next tick retries
        }
      }, 1000);

      // Safety: auto-close after 5 minutes.
      setTimeout(() => {
        if (!closed) {
          clearInterval(interval);
          closed = true;
          try {
            controller.close();
          } catch {}
        }
      }, 5 * 60 * 1000);
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
