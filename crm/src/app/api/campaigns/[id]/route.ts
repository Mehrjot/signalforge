import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
    include: {
      communications: {
        include: { customer: { select: { name: true, city: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    campaign: {
      ...campaign,
      simulation: campaign.simulation ? JSON.parse(campaign.simulation) : null,
      communications: campaign.communications.map((c: any) => ({
        id: c.id,
        customerName: c.customer.name,
        city: c.customer.city,
        channel: c.channel,
        message: c.message,
        status: c.status,
        confidence: c.confidence,
        selectionReason: c.selectionReason,
      })),
    },
  });
}
