import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { goalToSegment } from "@/lib/ai";
import { runSegment, selectionReason, confidenceFor } from "@/lib/helpers";

export const dynamic = "force-dynamic";

// POST /api/campaigns/segment { goal }  -> AI builds a segment, returns audience.
export async function POST(req: Request) {
  const { goal } = await req.json();
  if (!goal) return NextResponse.json({ error: "Goal required" }, { status: 400 });

  const categories = [...new Set<string>((await prisma.order.findMany({ select: { category: true } })).map((o: { category: string }) => o.category))];
  const cities = [...new Set<string>((await prisma.customer.findMany({ select: { city: true } })).map((c: { city: string }) => c.city))];

  const spec = await goalToSegment(goal, categories, cities);
  const audience = await runSegment(spec);

  return NextResponse.json({
    spec,
    audience: audience.map((c) => ({
      ...c,
      reason: selectionReason(c),
      confidence: confidenceFor(c),
    })),
  });
}
