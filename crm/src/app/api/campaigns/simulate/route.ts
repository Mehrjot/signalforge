import { NextResponse } from "next/server";
import { simulateChannels, goalToSegment } from "@/lib/ai";
import { runSegment } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST /api/campaigns/simulate { goal }  -> What-If channel projections.
export async function POST(req: Request) {
  const { goal } = await req.json();
  const categories = [...new Set<string>((await prisma.order.findMany({ select: { category: true } })).map((o: { category: string }) => o.category))];
  const cities = [...new Set<string>((await prisma.customer.findMany({ select: { city: true } })).map((c: { city: string }) => c.city))];
  const spec = await goalToSegment(goal, categories, cities);
  const audience = await runSegment(spec);
  const rows = await simulateChannels(audience, goal);
  return NextResponse.json({ rows, audienceSize: audience.length });
}
