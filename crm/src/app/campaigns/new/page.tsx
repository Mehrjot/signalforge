"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  Users,
  ArrowRight,
  Wand2,
  CheckCircle2,
  Radio,
} from "lucide-react";
import { inrFull, CHANNEL_META } from "@/lib/format";

type AudienceMember = {
  id: string;
  name: string;
  city: string;
  topCategory: string;
  totalSpend: number;
  reason: string;
  confidence: number;
};
type Spec = { name: string; reason: string; filters: Record<string, unknown> };
type SimRow = { channel: string; expectedReach: number; expectedRevenue: number; rationale: string };

const SUGGESTIONS = [
  "Re-engage customers who haven't ordered in 60 days with a 15% comeback offer",
  "Reward VIP shoppers with lifetime spend over ₹10,000 with early festival access",
  "Welcome recent first-time buyers and nudge a second purchase",
];

function Builder() {
  const router = useRouter();
  const params = useSearchParams();
  const [goal, setGoal] = useState("");
  const [stage, setStage] = useState<"idle" | "segmenting" | "ready" | "launching">("idle");
  const [spec, setSpec] = useState<Spec | null>(null);
  const [audience, setAudience] = useState<AudienceMember[]>([]);
  const [sim, setSim] = useState<SimRow[]>([]);
  const [channel, setChannel] = useState("smart");

  useEffect(() => {
    const g = params.get("goal");
    if (g) {
      setGoal(g);
      void analyze(g);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyze(g?: string) {
    const query = g ?? goal;
    if (!query.trim()) return;
    setStage("segmenting");
    setSpec(null);
    setAudience([]);
    setSim([]);
    try {
      const [segRes, simRes] = await Promise.all([
        fetch("/api/campaigns/segment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal: query }),
        }).then((r) => r.json()),
        fetch("/api/campaigns/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal: query }),
        }).then((r) => r.json()),
      ]);
      setSpec(segRes.spec);
      setAudience(segRes.audience || []);
      setSim(simRes.rows || []);
      setStage("ready");
    } catch {
      setStage("idle");
    }
  }

  async function launch() {
    setStage("launching");
    try {
      const res = await fetch("/api/campaigns/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, name: spec?.name, channel }),
      }).then((r) => r.json());
      if (res.campaignId) router.push(`/campaigns/${res.campaignId}`);
      else setStage("ready");
    } catch {
      setStage("ready");
    }
  }

  const topChannel = sim[0]?.channel;

  return (
    <div className="px-10 py-12">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary-soft" />
        <span className="label">Campaign Autopilot</span>
      </div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
        Describe what you want to achieve.
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        Write a goal in plain English. The AI finds the audience, drafts
        personalised messages, picks the best channel, and projects revenue
        before a single message goes out.
      </p>

      {/* Goal input */}
      <div className="mt-7 max-w-3xl">
        <div className="card p-2">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. Win back lapsed customers who loved our sarees with a personal 15% offer…"
            rows={3}
            className="w-full resize-none bg-transparent px-4 py-3 text-[15px] text-ink outline-none placeholder:text-muted-2"
          />
          <div className="flex items-center justify-between px-2 pb-1">
            <span className="label">Natural language goal</span>
            <button
              onClick={() => analyze()}
              disabled={!goal.trim() || stage === "segmenting"}
              className="btn-primary"
            >
              {stage === "segmenting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" /> Build campaign
                </>
              )}
            </button>
          </div>
        </div>

        {stage === "idle" && (
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setGoal(s);
                  void analyze(s);
                }}
                className="chip hover:border-primary/40 hover:text-ink"
              >
                {s.length > 52 ? s.slice(0, 52) + "…" : s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {stage !== "idle" && stage !== "segmenting" && spec && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 grid grid-cols-12 gap-6"
          >
            {/* Left: audience + reasoning */}
            <div className="col-span-7 space-y-6">
              <div className="card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary-soft" />
                    <h3 className="font-display text-lg font-bold text-ink">
                      {spec.name}
                    </h3>
                  </div>
                  <span className="chip">
                    {audience.length} shoppers
                  </span>
                </div>
                <div className="card-2 mb-4 p-3.5">
                  <div className="label mb-1">Why this audience</div>
                  <p className="text-sm leading-relaxed text-ink">{spec.reason}</p>
                </div>

                <div className="label mb-2">Selected shoppers · why each</div>
                <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                  {audience.slice(0, 30).map((m) => (
                    <div
                      key={m.id}
                      className="card-2 flex items-center gap-3 p-3"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-xs font-bold text-primary-soft">
                        {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-ink">
                          {m.name}{" "}
                          <span className="text-muted">· {m.topCategory}</span>
                        </div>
                        <div className="truncate font-mono text-[11px] text-muted">
                          {m.reason}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-display text-sm font-bold text-live">
                          {m.confidence}%
                        </div>
                        <div className="label">confidence</div>
                      </div>
                    </div>
                  ))}
                  {audience.length === 0 && (
                    <div className="py-6 text-center text-sm text-muted">
                      No shoppers matched. Try a broader goal.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: what-if simulator + launch */}
            <div className="col-span-5 space-y-6">
              <div className="card p-6">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-base">🔮</span>
                  <h3 className="font-display text-lg font-bold text-ink">
                    What-If Simulator
                  </h3>
                </div>
                <p className="mb-4 text-xs text-muted">
                  Projected reach & revenue per channel for this audience.
                </p>
                <div className="space-y-2.5">
                  {sim.map((row, i) => {
                    const meta = CHANNEL_META[row.channel];
                    const isTop = row.channel === topChannel;
                    const max = sim[0]?.expectedRevenue || 1;
                    return (
                      <div key={row.channel} className="relative">
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 font-medium text-ink">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: meta?.color }}
                            />
                            {meta?.label}
                            {isTop && (
                              <span className="chip ml-1 border-live/30 text-live">
                                best
                              </span>
                            )}
                          </span>
                          <span className="font-display font-bold text-ink">
                            {inrFull(row.expectedRevenue)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(row.expectedRevenue / max) * 100}%` }}
                            transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }}
                            className="h-full rounded-full"
                            style={{ background: meta?.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-6">
                <div className="label mb-3">Channel strategy</div>
                <div className="mb-5 grid grid-cols-2 gap-2">
                  <ChannelPick
                    value="smart"
                    current={channel}
                    onSelect={setChannel}
                    label="Smart (per-shopper)"
                    desc="AI picks the best channel for each person"
                  />
                  {["whatsapp", "email", "sms"].map((c) => (
                    <ChannelPick
                      key={c}
                      value={c}
                      current={channel}
                      onSelect={setChannel}
                      label={CHANNEL_META[c].label}
                      desc=""
                    />
                  ))}
                </div>
                <button
                  onClick={launch}
                  disabled={audience.length === 0 || stage === "launching"}
                  className="btn-primary w-full"
                >
                  {stage === "launching" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Launching to{" "}
                      {audience.length} shoppers…
                    </>
                  ) : (
                    <>
                      <Radio className="h-4 w-4" /> Launch campaign
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <p className="mt-3 flex items-center gap-1.5 text-center text-[11px] text-muted">
                  <CheckCircle2 className="h-3 w-3 text-live" />
                  Messages are AI-personalised per shopper at launch.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChannelPick({
  value,
  current,
  onSelect,
  label,
  desc,
}: {
  value: string;
  current: string;
  onSelect: (v: string) => void;
  label: string;
  desc: string;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onSelect(value)}
      className={`rounded-lg border p-2.5 text-left transition-all ${
        active
          ? "border-primary bg-primary/15"
          : "border-line bg-surface-2 hover:border-line"
      } ${value === "smart" ? "col-span-2" : ""}`}
    >
      <div className={`text-sm font-medium ${active ? "text-ink" : "text-muted"}`}>
        {label}
      </div>
      {desc && <div className="mt-0.5 text-[11px] text-muted">{desc}</div>}
    </button>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={<div className="px-10 py-12 text-muted">Loading…</div>}>
      <Builder />
    </Suspense>
  );
}
