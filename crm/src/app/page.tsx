"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Users, AlertTriangle, Loader2, Cpu, Database, Sparkles, Radio } from "lucide-react";
import NetworkBackground from "@/components/NetworkBackground";
import { inr, inrFull } from "@/lib/format";

type Opportunity = {
  emoji: string;
  title: string;
  detail: string;
  potentialRevenue: number;
  suggestedGoal: string;
};

export default function CommandCenter() {
  const router = useRouter();
  const [data, setData] = useState<{
    aiEnabled: boolean;
    opportunities: Opportunity[];
    stats: { totalCustomers: number; totalRevenue: number; lapsedCount: number; vipAtRiskCount: number };
  } | null>(null);

  useEffect(() => {
    fetch("/api/brief")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  function actOn(goal: string) {
    router.push(`/campaigns/new?goal=${encodeURIComponent(goal)}`);
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 h-[460px] overflow-hidden">
        <NetworkBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/50 to-bg" />
      </div>

      <div className="relative px-10 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          <div className="mb-4 flex items-center gap-2">
            <span className="chip">
              <Cpu className="h-3 w-3 text-primary-soft" />
              {data?.aiEnabled ? "AI engine live" : "Heuristic mode"}
            </span>
            <span className="chip">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live" />
              {data?.stats.totalCustomers ?? "—"} shoppers tracked
            </span>
          </div>
          <h1 className="font-display text-[46px] font-extrabold leading-[1.05] tracking-tight text-ink glow-text">
            {greeting}.
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-muted">
            SignalForge scanned your shopper base and found today's highest-value
            moves. Each card below launches a ready-to-go campaign in one click.
          </p>
        </motion.div>

        {/* How it works — quick orientation strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-8 flex flex-wrap items-center gap-2 text-sm text-muted"
        >
          <Flow icon={<Database className="h-3.5 w-3.5" />} label="Ingest" />
          <ArrowRight className="h-3.5 w-3.5 text-muted-2" />
          <Flow icon={<Users className="h-3.5 w-3.5" />} label="Segment" />
          <ArrowRight className="h-3.5 w-3.5 text-muted-2" />
          <Flow icon={<Sparkles className="h-3.5 w-3.5" />} label="Launch" />
          <ArrowRight className="h-3.5 w-3.5 text-muted-2" />
          <Flow icon={<Radio className="h-3.5 w-3.5" />} label="Track live" />
        </motion.div>

        <div className="mt-9 grid grid-cols-3 gap-4">
          <Stat icon={<Users className="h-4 w-4" />} label="Total shoppers" value={data ? String(data.stats.totalCustomers) : "—"} />
          <Stat icon={<TrendingUp className="h-4 w-4" />} label="Lifetime revenue" value={data ? inr(data.stats.totalRevenue) : "—"} />
          <Stat icon={<AlertTriangle className="h-4 w-4" />} label="Need attention" value={data ? String(data.stats.lapsedCount + data.stats.vipAtRiskCount) : "—"} accent />
        </div>

        <div className="mt-11">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink">Today's opportunities</h2>
            <span className="label">Ranked by potential revenue</span>
          </div>

          {!data ? (
            <div className="flex items-center gap-2 py-10 text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Scanning shopper base…
            </div>
          ) : data.opportunities.length === 0 ? (
            <div className="card p-8 text-center text-muted">
              No standout opportunities right now — your base is healthy.
            </div>
          ) : (
            <div className="grid gap-4">
              {data.opportunities.map((o, i) => (
                <motion.button
                  key={i}
                  onClick={() => actOn(o.suggestedGoal)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="group card flex items-center gap-5 p-5 text-left transition-all hover:border-primary/40 hover:bg-surface-2"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surface-2 text-2xl">
                    {o.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[17px] font-bold text-ink">{o.title}</div>
                    <div className="mt-0.5 text-sm text-muted">{o.detail}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="label">Potential</div>
                    <div className="font-display text-xl font-bold text-live">{inrFull(o.potentialRevenue)}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/15 px-3 py-2 text-sm font-medium text-primary-soft transition-all group-hover:bg-primary group-hover:text-white">
                    Launch
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Flow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5">
      <span className="text-primary-soft">{icon}</span>
      <span className="font-medium text-ink">{label}</span>
    </span>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2 text-muted">
        <span className={accent ? "text-warn" : "text-primary-soft"}>{icon}</span>
        <span className="label">{label}</span>
      </div>
      <div className={`font-display text-3xl font-extrabold ${accent ? "text-warn" : "text-ink"}`}>{value}</div>
    </div>
  );
}
