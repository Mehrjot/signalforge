import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SHOPPER_COUNT = 240;

// ============================================================
//  Seed data for "SignalForge" — a fictional D2C ethnic-wear label.
//  We simulate 60 shoppers with realistic order histories so the
//  product has something meaningful to reason about out of the box.
// ============================================================

const FIRST = ["Priya", "Rahul", "Ananya", "Vikram", "Meera", "Arjun", "Kavya", "Rohan", "Diya", "Aditya", "Ishita", "Karan", "Nisha", "Sameer", "Tara", "Aryan", "Riya", "Dev", "Sneha", "Kabir", "Pooja", "Varun", "Aisha", "Nikhil", "Sara", "Manish", "Divya", "Yash", "Anjali", "Siddharth"];
const LAST = ["Sharma", "Verma", "Iyer", "Nair", "Reddy", "Kapoor", "Mehta", "Singh", "Patel", "Rao", "Bose", "Joshi", "Malhotra", "Gupta", "Khanna"];
const CITIES = ["Mumbai", "Bengaluru", "Delhi", "Chennai", "Hyderabad", "Pune", "Kolkata"];
const CATEGORIES = ["Ethnic Wear", "Sarees", "Lehengas", "Kurtas", "Accessories"];
const ITEMS: Record<string, string[]> = {
  "Ethnic Wear": ["Anarkali Suit", "Sharara Set", "Palazzo Set"],
  Sarees: ["Kanjivaram Silk Saree", "Banarasi Saree", "Chiffon Saree"],
  Lehengas: ["Bridal Lehenga", "Party Lehenga", "Lightweight Lehenga"],
  Kurtas: ["Cotton Kurta", "Silk Kurta", "Festive Kurta Set"],
  Accessories: ["Jhumka Earrings", "Potli Bag", "Embroidered Dupatta"],
};

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function daysAgo(d: number) {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("🌱 Resetting data...");
  await prisma.commEvent.deleteMany();
  await prisma.communication.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  console.log("🌱 Seeding shoppers with order histories...");

  for (let i = 0; i < SHOPPER_COUNT; i++) {
    const name = `${rand(FIRST)} ${rand(LAST)}`;
    const city = rand(CITIES);

    // Create a behavioural archetype so the data has structure to discover.
    const archetype = randInt(1, 4);
    // 1 = VIP active, 2 = VIP lapsed, 3 = regular, 4 = casual/new
    let orderCount: number, lastDays: number, spendPerOrder: number;
    if (archetype === 1) {
      orderCount = randInt(5, 9); lastDays = randInt(5, 25); spendPerOrder = randInt(2500, 5000);
    } else if (archetype === 2) {
      orderCount = randInt(4, 8); lastDays = randInt(65, 130); spendPerOrder = randInt(2500, 5000);
    } else if (archetype === 3) {
      orderCount = randInt(2, 4); lastDays = randInt(20, 70); spendPerOrder = randInt(1200, 2800);
    } else {
      orderCount = randInt(1, 2); lastDays = randInt(3, 40); spendPerOrder = randInt(900, 2000);
    }

    // Channel affinities — give each archetype a tilt.
    const whatsappScore = randInt(archetype <= 2 ? 60 : 40, archetype <= 2 ? 95 : 80);
    const emailScore = randInt(20, 70);
    const smsScore = randInt(15, 60);

    const favCategory = rand(CATEGORIES);
    const orders: { category: string; amount: number; placedAt: Date; items: string }[] = [];
    let total = 0;
    let firstOrderAt: Date | null = null;
    for (let o = 0; o < orderCount; o++) {
      // Space orders out before the last one.
      const dayOffset = lastDays + (orderCount - 1 - o) * randInt(30, 55);
      const placedAt = daysAgo(dayOffset);
      if (!firstOrderAt || placedAt < firstOrderAt) firstOrderAt = placedAt;
      const cat = Math.random() < 0.7 ? favCategory : rand(CATEGORIES);
      const amount = spendPerOrder + randInt(-300, 300);
      total += amount;
      orders.push({
        category: cat,
        amount,
        placedAt,
        items: JSON.stringify([rand(ITEMS[cat])]),
      });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email: `${name.toLowerCase().replace(/ /g, ".")}@example.com`,
        phone: `+9198${randInt(10000000, 99999999)}`,
        city,
        whatsappScore,
        emailScore,
        smsScore,
        totalSpend: total,
        orderCount,
        firstOrderAt,
        lastOrderAt: daysAgo(lastDays),
      },
    });

    for (const o of orders) {
      await prisma.order.create({ data: { ...o, customerId: customer.id } });
    }
  }

  const count = await prisma.customer.count();
  const orders = await prisma.order.count();
  console.log(`✅ Seeded ${count} customers and ${orders} orders for SignalForge.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
