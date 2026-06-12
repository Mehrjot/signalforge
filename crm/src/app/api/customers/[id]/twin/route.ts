import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toLite } from "@/lib/helpers";
import { generateTwin } from "@/lib/ai";

export const dynamic = "force-dynamic";

// POST /api/customers/:id/twin  -> generate (or regenerate) the AI Digital Twin.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const lite = await toLite(params.id);
  if (!lite) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const twin = await generateTwin(lite);
  await prisma.customer.update({
    where: { id: params.id },
    data: {
      twinSummary: twin.summary,
      twinTraits: JSON.stringify(twin.traits),
      twinGeneratedAt: new Date(),
    },
  });
  return NextResponse.json(twin);
}
