import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { daysSince, liteFromRow } from "@/lib/helpers";

export const dynamic = "force-dynamic";

// Auto-cluster the shopper base into a handful of behavioural segments. The
// rules are intentionally simple and explainable — each shopper lands in
// exactly one bucket based on spend, recency and order count.
export async function GET() {
  const customers = await prisma.customer.findMany({ include: { orders: true } });

  const buckets: Record<string, { label: string; emoji: string; desc: string; members: any[] }> = {
    champions: { label: "Champions", emoji: "👑", desc: "High spend, recently active. Your core.", members: [] },
    atRisk: { label: "At Risk", emoji: "⚠️", desc: "Were valuable, now going quiet.", members: [] },
    loyal: { label: "Loyal Regulars", emoji: "💜", desc: "Steady repeat buyers.", members: [] },
    newcomers: { label: "Newcomers", emoji: "🌱", desc: "Recent first or second purchase.", members: [] },
    dormant: { label: "Dormant", emoji: "🌙", desc: "Long silent, low engagement.", members: [] },
  };

  for (const row of customers) {
    const d = daysSince(row.lastOrderAt);
    const lite = liteFromRow(row);
    const entry = { id: lite.id, name: lite.name, city: lite.city, totalSpend: lite.totalSpend, topCategory: lite.topCategory };

    if (row.totalSpend > 10000 && d != null && d <= 35) buckets.champions.members.push(entry);
    else if (row.totalSpend > 8000 && d != null && d > 45) buckets.atRisk.members.push(entry);
    else if (row.orderCount >= 3 && d != null && d <= 70) buckets.loyal.members.push(entry);
    else if (row.orderCount <= 2 && d != null && d <= 45) buckets.newcomers.members.push(entry);
    else buckets.dormant.members.push(entry);
  }

  const clusters = Object.entries(buckets).map(([key, b]) => ({
    key,
    label: b.label,
    emoji: b.emoji,
    desc: b.desc,
    size: b.members.length,
    revenue: b.members.reduce((sum, m) => sum + m.totalSpend, 0),
    sample: b.members.slice(0, 6),
  }));

  return NextResponse.json({ clusters, total: customers.length });
}
