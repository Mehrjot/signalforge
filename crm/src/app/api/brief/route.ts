import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { daysSince } from "@/lib/helpers";
import { generateBrief, AI_ENABLED } from "@/lib/ai";

export const dynamic = "force-dynamic";

// GET /api/brief  -> compute live opportunity signals from the customer base.
export async function GET() {
  const customers = await prisma.customer.findMany();

  let lapsedCount = 0,
    lapsedRevenue = 0,
    vipAtRiskCount = 0,
    vipAtRiskRevenue = 0,
    newCustomerCount = 0;

  for (const c of customers) {
    const d = daysSince(c.lastOrderAt);
    const avgOrderValue = c.orderCount ? c.totalSpend / c.orderCount : 0;
    if (d != null && d > 60) {
      lapsedCount++;
      lapsedRevenue += avgOrderValue;
    }
    if (c.totalSpend > 10000 && d != null && d > 30) {
      vipAtRiskCount++;
      vipAtRiskRevenue += avgOrderValue;
    }
    if (c.orderCount <= 2 && d != null && d < 45) newCustomerCount++;
  }

  const opportunities = await generateBrief({
    lapsedCount,
    lapsedRevenue,
    vipAtRiskCount,
    vipAtRiskRevenue,
    newCustomerCount,
  });

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((s: number, c: any) => s + c.totalSpend, 0);

  return NextResponse.json({
    aiEnabled: AI_ENABLED,
    opportunities,
    stats: { totalCustomers, totalRevenue, lapsedCount, vipAtRiskCount },
  });
}
