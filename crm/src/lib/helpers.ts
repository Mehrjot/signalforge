import { prisma } from "./prisma";
import type { CustomerLite, SegmentSpec } from "./ai";

export const CHANNEL_SERVICE_URL =
  process.env.CHANNEL_SERVICE_URL || "http://localhost:4000";

export const CRM_PUBLIC_URL =
  process.env.CRM_PUBLIC_URL || "http://localhost:3000";

export function daysSince(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// Turn a Customer row (+ its orders) into the lite shape the AI layer uses.
export async function toLite(customerId: string): Promise<CustomerLite | null> {
  const c = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { orders: true },
  });
  if (!c) return null;
  return liteFromRow(c);
}

export function liteFromRow(c: any): CustomerLite {
  const catCounts: Record<string, number> = {};
  for (const o of c.orders ?? []) {
    catCounts[o.category] = (catCounts[o.category] || 0) + 1;
  }
  const topCategory =
    Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "General";
  return {
    id: c.id,
    name: c.name,
    city: c.city,
    totalSpend: c.totalSpend,
    orderCount: c.orderCount,
    daysSinceLastOrder: daysSince(c.lastOrderAt),
    topCategory,
    whatsappScore: c.whatsappScore,
    emailScore: c.emailScore,
    smsScore: c.smsScore,
  };
}

// Execute a SegmentSpec against the customer table.
export async function runSegment(spec: SegmentSpec): Promise<CustomerLite[]> {
  const all = await prisma.customer.findMany({ include: { orders: true } });
  const f = spec.filters;
  return all
    .map(liteFromRow)
    .filter((c: CustomerLite) => {
      if (f.minSpend != null && c.totalSpend < f.minSpend) return false;
      if (f.minOrders != null && c.orderCount < f.minOrders) return false;
      if (f.category && c.topCategory.toLowerCase() !== f.category.toLowerCase())
        return false;
      if (f.city && c.city.toLowerCase() !== f.city.toLowerCase()) return false;
      if (f.minDaysSinceOrder != null) {
        if (c.daysSinceLastOrder == null) return false;
        if (c.daysSinceLastOrder < f.minDaysSinceOrder) return false;
      }
      if (f.maxDaysSinceOrder != null) {
        if (c.daysSinceLastOrder == null) return false;
        if (c.daysSinceLastOrder > f.maxDaysSinceOrder) return false;
      }
      return true;
    });
}

export function bestChannel(c: CustomerLite): "whatsapp" | "email" | "sms" {
  const m = Math.max(c.whatsappScore, c.emailScore, c.smsScore);
  if (m === c.whatsappScore) return "whatsapp";
  if (m === c.emailScore) return "email";
  return "sms";
}

export function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

// Build an explainability string for why a customer was selected.
export function selectionReason(c: CustomerLite): string {
  const parts: string[] = [];
  if (c.daysSinceLastOrder != null)
    parts.push(`Last order ${c.daysSinceLastOrder} days ago`);
  parts.push(`Lifetime spend ${inr(c.totalSpend)}`);
  parts.push(`${c.orderCount} orders`);
  const ch = bestChannel(c);
  const score = ch === "whatsapp" ? c.whatsappScore : ch === "email" ? c.emailScore : c.smsScore;
  parts.push(`${score}% ${ch} affinity`);
  return parts.join(" · ");
}

export function confidenceFor(c: CustomerLite): number {
  // Simple, explainable confidence: blends channel affinity and recency.
  const ch = bestChannel(c);
  const affinity = ch === "whatsapp" ? c.whatsappScore : ch === "email" ? c.emailScore : c.smsScore;
  const recency =
    c.daysSinceLastOrder == null
      ? 50
      : Math.max(0, 100 - Math.abs(c.daysSinceLastOrder - 55));
  return Math.min(98, Math.round(affinity * 0.6 + recency * 0.4));
}
