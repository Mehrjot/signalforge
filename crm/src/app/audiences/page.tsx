"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Layers, ArrowRight, Sparkles } from "lucide-react";
import { inrFull } from "@/lib/format";

type Cluster = {
  key: string;
  label: string;
  emoji: string;
  desc: string;
  size: number;
  revenue: number;
  sample: { id: string; name: string; city: string; topCategory: string }[];
};

export default function AudiencesPage() {
  const router = useRouter();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch("/api/audiences")
      .then((r) => r.json())
      .then((d) => {
        setClusters(d.clusters || []);
        setTotal(d.total || 0);
      });
  }, []);

  const goalFor: Record<string, string> = {
    champions: "Reward Champions — high-value, recently active shoppers — with VIP early access to the new collection.",
    atRisk: "Win back at-risk customers who were valuable but haven't ordered recently, with a personal comeback offer.",
    loyal: "Thank loyal repeat buyers and encourage their next purchase with a loyalty perk.",
    newcomers: "Welcome newcomers and nudge a second purchase with a friendly first-time offer.",
    dormant: "Reactivate long-dormant shoppers with a strong win-back incentive.",
  };

  return (
    <div className="px-10 py-12">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary-soft" />
          <span className="label">Audience Explorer</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          Your shoppers, auto-segmented
        </h1>
        <p className="mt-1 text-muted">
          {total} shoppers grouped into behavioural segments by spend, recency and frequency.
          Launch a tailored campaign into any segment in one click.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {clusters.map((c, i) => (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card flex flex-col p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-3xl">
                {c.emoji}
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-extrabold text-ink">{c.size}</div>
                <div className="label">shoppers</div>
              </div>
            </div>
            <h3 className="font-display text-lg font-bold text-ink">{c.label}</h3>
            <p className="mt-1 text-sm text-muted">{c.desc}</p>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2">
              <span className="label">Segment value</span>
              <span className="font-display text-sm font-bold text-live">
                {inrFull(c.revenue)}
              </span>
            </div>

            {c.sample.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.sample.slice(0, 4).map((m) => (
                  <span key={m.id} className="chip">
                    {m.name.split(" ")[0]}
                  </span>
                ))}
                {c.size > 4 && <span className="chip">+{c.size - 4}</span>}
              </div>
            )}

            <button
              onClick={() => router.push(`/campaigns/new?goal=${encodeURIComponent(goalFor[c.key] || "")}`)}
              disabled={c.size === 0}
              className="btn-primary mt-5 w-full"
            >
              <Sparkles className="h-4 w-4" /> Campaign for this segment
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
