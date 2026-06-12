import { NextResponse } from "next/server";
import { critiqueMessage } from "@/lib/ai";

export const dynamic = "force-dynamic";

// POST /api/critique { message } -> AI evaluates the message.
export async function POST(req: Request) {
  const { message } = await req.json();
  if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });
  const result = await critiqueMessage(message);
  return NextResponse.json(result);
}
