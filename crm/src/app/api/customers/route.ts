import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { liteFromRow, selectionReason, confidenceFor } from "@/lib/helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const customers = await prisma.customer.findMany({
    include: { orders: true },
    orderBy: { totalSpend: "desc" },
  });
  const enriched = customers.map((c: any) => {
    const lite = liteFromRow(c);
    return {
      ...lite,
      email: c.email,
      phone: c.phone,
      twinSummary: c.twinSummary,
      twinTraits: c.twinTraits ? JSON.parse(c.twinTraits) : [],
      reason: selectionReason(lite),
      confidence: confidenceFor(lite),
      orders: c.orders
        .sort((a: any, b: any) => b.placedAt.getTime() - a.placedAt.getTime())
        .map((o: any) => ({
          id: o.id,
          category: o.category,
          amount: o.amount,
          placedAt: o.placedAt,
          items: JSON.parse(o.items),
        })),
    };
  });
  return NextResponse.json({ customers: enriched });
}
