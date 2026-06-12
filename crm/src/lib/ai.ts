import Anthropic from "@anthropic-ai/sdk";

// The product talks to one of three LLM providers depending on which key is
// present in the environment. Gemini first because its free tier is the one
// most people will actually use; Groq next; Anthropic last. With no key set,
// every function below falls back to a heuristic so the app still runs.

const geminiKey = process.env.GEMINI_API_KEY;
const groqKey = process.env.GROQ_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

type Provider = "gemini" | "groq" | "anthropic" | "none";

const provider: Provider = geminiKey
  ? "gemini"
  : groqKey
  ? "groq"
  : anthropicKey
  ? "anthropic"
  : "none";

export const AI_ENABLED = provider !== "none";
export const AI_PROVIDER = provider;

const anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;

const GEMINI_MODEL = "gemini-2.5-flash";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const ANTHROPIC_MODEL = "claude-sonnet-4-6";

async function ask(system: string, user: string): Promise<string> {
  if (provider === "gemini") return askGemini(system, user);
  if (provider === "groq") return askGroq(system, user);
  if (provider === "anthropic") return askAnthropic(system, user);
  throw new Error("no provider");
}

async function askGemini(system: string, user: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function askGroq(system: string, user: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 1024,
    }),
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function askAnthropic(system: string, user: string): Promise<string> {
  if (!anthropic) throw new Error("anthropic not configured");
  const res = await anthropic.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

function parseJson<T>(text: string, fallback: T): T {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.search(/[[{]/);
    if (start === -1) return fallback;
    return JSON.parse(cleaned.slice(start)) as T;
  } catch {
    return fallback;
  }
}

export type CustomerLite = {
  id: string;
  name: string;
  city: string;
  totalSpend: number;
  orderCount: number;
  daysSinceLastOrder: number | null;
  topCategory: string;
  whatsappScore: number;
  emailScore: number;
  smsScore: number;
};

export async function generateTwin(c: CustomerLite): Promise<{ summary: string; traits: string[] }> {
  if (!AI_ENABLED) return heuristicTwin(c);
  const text = await ask(
    'You are a CRM analyst. Write a tight 2-sentence personality profile of a retail shopper based on their data, then give 3 short trait tags. Respond ONLY as JSON: {"summary": string, "traits": string[]}. No markdown.',
    JSON.stringify(c)
  );
  return parseJson(text, heuristicTwin(c));
}

function heuristicTwin(c: CustomerLite): { summary: string; traits: string[] } {
  const cadence =
    c.daysSinceLastOrder === null
      ? "has not yet placed an order"
      : c.daysSinceLastOrder > 60
      ? "has gone quiet recently"
      : "shops regularly";
  const tier = c.totalSpend > 10000 ? "high-value" : c.totalSpend > 4000 ? "mid-tier" : "occasional";
  const channel = topChannel(c);
  const traits = [
    tier === "high-value" ? "VIP" : tier === "mid-tier" ? "Loyal" : "Casual",
    c.daysSinceLastOrder && c.daysSinceLastOrder > 60 ? "At-risk" : "Active",
    `Prefers ${channel}`,
  ];
  return {
    summary: `${c.name} is a ${tier} ${c.topCategory.toLowerCase()} shopper from ${c.city} who ${cadence}. Most responsive on ${channel}, with a lifetime spend of ₹${Math.round(
      c.totalSpend
    ).toLocaleString("en-IN")}.`,
    traits,
  };
}

function topChannel(c: CustomerLite): string {
  const m = Math.max(c.whatsappScore, c.emailScore, c.smsScore);
  if (m === c.whatsappScore) return "WhatsApp";
  if (m === c.emailScore) return "Email";
  return "SMS";
}

export type SegmentSpec = {
  name: string;
  reason: string;
  filters: {
    minDaysSinceOrder?: number;
    maxDaysSinceOrder?: number;
    minSpend?: number;
    minOrders?: number;
    category?: string;
    city?: string;
  };
};

export async function goalToSegment(goal: string, categories: string[], cities: string[]): Promise<SegmentSpec> {
  if (!AI_ENABLED) return heuristicSegment(goal);
  const text = await ask(
    `You convert a marketer's goal into a customer filter for a retail CRM.
Known product categories: ${categories.join(", ")}.
Known cities: ${cities.join(", ")}.
Respond ONLY as JSON matching:
{"name": string, "reason": string, "filters": {"minDaysSinceOrder"?: number, "maxDaysSinceOrder"?: number, "minSpend"?: number, "minOrders"?: number, "category"?: string, "city"?: string}}
"reason" explains the targeting logic in one sentence. Omit filters that don't apply.`,
    goal
  );
  return parseJson(text, heuristicSegment(goal));
}

function heuristicSegment(goal: string): SegmentSpec {
  const g = goal.toLowerCase();
  const filters: SegmentSpec["filters"] = {};
  const dayMatch = g.match(/(\d+)\s*day/);
  if (g.includes("lapsed") || g.includes("haven't") || g.includes("inactive") || g.includes("re-engage") || g.includes("win back")) {
    filters.minDaysSinceOrder = dayMatch ? parseInt(dayMatch[1]) : 60;
  }
  if (g.includes("vip") || g.includes("high value") || g.includes("high-value") || g.includes("best")) {
    filters.minSpend = 10000;
  }
  if (g.includes("loyal") || g.includes("repeat")) filters.minOrders = 3;
  return {
    name: "Targeted Audience",
    reason: "Selected customers matching the goal's recency and value signals.",
    filters,
  };
}

export async function generateMessage(
  goal: string,
  channel: string,
  customer: { name: string; topCategory: string; city: string }
): Promise<string> {
  if (!AI_ENABLED) return heuristicMessage(channel, customer);
  const text = await ask(
    `You are a brand's CRM copywriter. Write ONE short ${channel} message (under 240 chars) for this shopper to achieve the campaign goal. Be warm, specific to their top category, include their first name. No quotes, no markdown, just the message text.
Campaign goal: ${goal}`,
    JSON.stringify(customer)
  );
  return text.trim() || heuristicMessage(channel, customer);
}

function heuristicMessage(channel: string, c: { name: string; topCategory: string }): string {
  const first = c.name.split(" ")[0];
  return `Hi ${first}, your favourite ${c.topCategory} picks are waiting for you — enjoy an exclusive 15% off, just for you. Tap to shop before it's gone!`;
}

export async function critiqueMessage(message: string): Promise<{
  issues: string[];
  predictedEngagement: number;
  rewrite: string;
  rewriteEngagement: number;
}> {
  const fallback = {
    issues: message.length > 200 ? ["Message is a little long"] : [],
    predictedEngagement: 8 + Math.round(Math.random() * 4),
    rewrite: message,
    rewriteEngagement: 12 + Math.round(Math.random() * 5),
  };
  if (!AI_ENABLED) return fallback;
  const text = await ask(
    `Critique this marketing message. Identify weaknesses (generic CTA, no urgency, no personalisation). Predict engagement %, then rewrite it better with a higher predicted %. Respond ONLY as JSON:
{"issues": string[], "predictedEngagement": number, "rewrite": string, "rewriteEngagement": number}`,
    message
  );
  return parseJson(text, fallback);
}

export type SimRow = { channel: string; expectedReach: number; expectedRevenue: number; rationale: string };

export async function simulateChannels(audience: CustomerLite[], _goal: string): Promise<SimRow[]> {
  const channels = ["whatsapp", "email", "sms"];
  const rows = channels.map((ch) => {
    const key = (ch + "Score") as "whatsappScore" | "emailScore" | "smsScore";
    const avgScore = audience.reduce((sum, c) => sum + c[key], 0) / Math.max(audience.length, 1);
    const reachRate = avgScore / 100;
    const expectedReach = Math.round(audience.length * reachRate);
    const avgSpend = audience.reduce((sum, c) => sum + c.totalSpend, 0) / Math.max(audience.length, 1);
    const conversionRate = reachRate * 0.12;
    const expectedRevenue = Math.round(expectedReach * conversionRate * (avgSpend * 0.25));
    return {
      channel: ch,
      expectedReach,
      expectedRevenue,
      rationale: `Avg ${ch} affinity ${Math.round(avgScore)}/100 across this audience.`,
    };
  });
  return rows.sort((a, b) => b.expectedRevenue - a.expectedRevenue);
}

export async function generateInsight(stats: {
  name: string;
  channel: string;
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  attributedOrders: number;
  attributedRevenue: number;
}): Promise<string> {
  if (!AI_ENABLED) {
    const readRate = stats.delivered ? Math.round((stats.read / stats.delivered) * 100) : 0;
    return `"${stats.name}" reached ${stats.delivered} shoppers with a ${readRate}% read rate. ${stats.clicked} clicked through and ${stats.attributedOrders} placed orders within 24h, generating ₹${Math.round(
      stats.attributedRevenue
    ).toLocaleString("en-IN")} in attributable revenue.`;
  }
  const text = await ask(
    "You are a CRM analyst. Write a 2-sentence plain-English insight about this completed campaign, leading with the most impressive number. No markdown.",
    JSON.stringify(stats)
  );
  return text.trim();
}

export type Opportunity = {
  emoji: string;
  title: string;
  detail: string;
  potentialRevenue: number;
  suggestedGoal: string;
};

export async function generateBrief(signals: {
  lapsedCount: number;
  lapsedRevenue: number;
  vipAtRiskCount: number;
  vipAtRiskRevenue: number;
  newCustomerCount: number;
}): Promise<Opportunity[]> {
  const opps: Opportunity[] = [];
  if (signals.lapsedCount > 0)
    opps.push({
      emoji: "🔥",
      title: `${signals.lapsedCount} shoppers overdue for repurchase`,
      detail: "Past their typical reorder window — prime for a nudge.",
      potentialRevenue: signals.lapsedRevenue,
      suggestedGoal: "Re-engage customers who haven't ordered in 60 days with a 15% comeback offer on their favourite category.",
    });
  if (signals.vipAtRiskCount > 0)
    opps.push({
      emoji: "⚠️",
      title: `${signals.vipAtRiskCount} VIP customers going quiet`,
      detail: "Your highest spenders haven't purchased in 30+ days.",
      potentialRevenue: signals.vipAtRiskRevenue,
      suggestedGoal: "Win back VIP customers (lifetime spend over ₹10,000) who haven't ordered in 30 days with an exclusive early-access offer.",
    });
  if (signals.newCustomerCount > 0)
    opps.push({
      emoji: "🎯",
      title: `${signals.newCustomerCount} new shoppers to welcome`,
      detail: "First-time buyers are most likely to convert again now.",
      potentialRevenue: Math.round(signals.newCustomerCount * 1200),
      suggestedGoal: "Welcome recent first-time buyers and encourage a second purchase with a thank-you offer.",
    });
  return opps;
}
