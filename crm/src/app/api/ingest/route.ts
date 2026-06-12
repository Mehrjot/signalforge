import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Accepts customer + order data in two formats:
//   1. JSON body  { customers: [...], orders: [...] }
//   2. CSV text   name,email,phone,city  (one customer per row, no orders)
//
// Deduplication: a customer is matched by email. If the email already exists
// we update their record rather than creating a duplicate. Orders are always
// appended (no dedup — assume each row is a new purchase event).
//
// This is the endpoint a real brand's data pipeline would call to push data in.

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  let customers: RawCustomer[] = [];
  let orders: RawOrder[] = [];

  if (contentType.includes("application/json")) {
    const body = await req.json();
    customers = body.customers ?? [];
    orders = body.orders ?? [];
  } else if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
    const text = await req.text();
    customers = parseCSV(text);
  } else {
    return NextResponse.json(
      { error: "Content-Type must be application/json or text/csv" },
      { status: 415 }
    );
  }

  if (customers.length === 0 && orders.length === 0) {
    return NextResponse.json({ error: "No data found in request" }, { status: 400 });
  }

  const result = await upsertAll(customers, orders);
  return NextResponse.json({ ok: true, ...result });
}

// ---- types ---------------------------------------------------------------

type RawCustomer = {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  whatsappScore?: number;
  emailScore?: number;
  smsScore?: number;
};

type RawOrder = {
  customerEmail: string;
  category: string;
  amount: number;
  placedAt?: string; // ISO date string
  items?: string[];
};

// ---- CSV parser -----------------------------------------------------------
// Expected header (first row, case-insensitive):
//   name, email, phone, city
// Extra columns are silently ignored.

function parseCSV(text: string): RawCustomer[] {
  const rows = text.trim().split(/\r?\n/);
  if (rows.length < 2) return [];

  const headers = rows[0].split(",").map((h) => h.trim().toLowerCase());
  const col = (name: string) => headers.indexOf(name);

  return rows.slice(1).flatMap((row) => {
    if (!row.trim()) return [];
    const cells = row.split(",").map((c) => c.trim());
    const email = cells[col("email")]?.toLowerCase();
    const name = cells[col("name")];
    if (!email || !name) return [];
    return [
      {
        name,
        email,
        phone: cells[col("phone")] || undefined,
        city: cells[col("city")] || undefined,
      },
    ];
  });
}

// ---- upsert logic --------------------------------------------------------

async function upsertAll(customers: RawCustomer[], orders: RawOrder[]) {
  let created = 0;
  let updated = 0;
  let ordersAdded = 0;

  // Build a local email→id map so order rows can reference customers we just
  // created in this same request, before the DB write is flushed.
  const emailToId: Record<string, string> = {};

  for (const c of customers) {
    const existing = await prisma.customer.findFirst({
      where: { email: c.email.toLowerCase() },
    });

    const data = {
      name: c.name,
      email: c.email.toLowerCase(),
      phone: c.phone ?? `+91${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      city: c.city ?? "India",
      whatsappScore: c.whatsappScore ?? randomScore(55, 90),
      emailScore: c.emailScore ?? randomScore(30, 75),
      smsScore: c.smsScore ?? randomScore(25, 65),
    };

    if (existing) {
      await prisma.customer.update({ where: { id: existing.id }, data });
      emailToId[c.email.toLowerCase()] = existing.id;
      updated++;
    } else {
      const fresh = await prisma.customer.create({ data });
      emailToId[c.email.toLowerCase()] = fresh.id;
      created++;
    }
  }

  for (const o of orders) {
    const customerId = emailToId[o.customerEmail?.toLowerCase()];
    if (!customerId) continue; // can't link — skip

    const placedAt = o.placedAt ? new Date(o.placedAt) : new Date();
    const amount = Number(o.amount) || 0;

    await prisma.order.create({
      data: {
        customerId,
        category: o.category || "General",
        items: JSON.stringify(o.items ?? [o.category ?? "item"]),
        amount,
        placedAt,
      },
    });

    // Keep the customer's denormalised totals in sync.
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalSpend: { increment: amount },
        orderCount: { increment: 1 },
        lastOrderAt: placedAt,
      },
    });

    ordersAdded++;
  }

  return { created, updated, ordersAdded };
}

function randomScore(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
