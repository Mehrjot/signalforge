import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    campaigns: campaigns.map((c: any) => ({
      ...c,
      simulation: c.simulation ? JSON.parse(c.simulation) : null,
    })),
  });
}
