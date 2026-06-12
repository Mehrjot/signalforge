"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { inrFull, EVENT_META, CHANNEL_META } from "@/lib/format";

type Campaign = {
  id: string;
  name: string;
  goalText: string;
  status: string;
  channel: string;
  audienceSize: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  readCount: number;
  clickedCount: number;
  failedCount: number;
  attributedOrders: number;
  attributedRevenue: number;
  insight: string | null;
};

type FeedItem = {
  id: number;
  event: string;
  customer: string;
  channel: string;
  at: string;
};

export default function WarRoom({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const idRef = useRef(0);
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const es = new EventSource(`/api/campaigns/${params.id}/stream`);
    es.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "snapshot" || msg.type === "stats" || msg.type === "completed") {
        if (msg.campaign) setCampaign(msg.campaign);
      }
      if (msg.type === "event") {
        setFeed((prev) =>
          [
            { id: idRef.current++, event: msg.event, customer: msg.customer, channel: msg.channel, at: msg.at },
            ...prev,
          ].slice(0, 80)
        );
      }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [params.id]);

  const funnel = campaign
    ? [
        { label: "Sent", value: campaign.sentCount, color: "#6B6880" },
        { label: "Delivered", value: campaign.deliveredCount, color: "#9C8FF9" },
        { label: "Read", value: campaign.readCount, color: "#7C6AF7" },
        { label: "Clicked", value: campaign.clickedCount, color: "#00E5A0" },
      ]
    : [];
  const maxFunnel = Math.max(campaign?.audienceSize || 1, 1);

  return (
    <div className="px-10 py-10">
      <Link
        href="/campaigns"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> All campaigns
      </Link>

      <div className="mb-7 flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className={`chip ${
                campaign?.status === "completed"
                  ? "border-live/30 text-live"
                  : "border-primary/30 text-primary-soft"
              }`}
            >
              {campaign?.status === "completed" ? (
                "Completed"
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-live" />
                  </span>
                  Live
                </>
              )}
            </span>
            <span className="chip">{campaign?.audienceSize ?? "—"} shoppers</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            {campaign?.name ?? "Loading…"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{campaign?.goalText}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Live event feed */}
        <div className="col-span-7">
          <div className="card flex h-[560px] flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-live" />
                <span className="font-display text-sm font-bold text-ink">
                  Live Event Stream
                </span>
              </div>
              <span className="label">callback-driven · real-time</span>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto p-3 font-mono">
              <div ref={feedEndRef} />
              <AnimatePresence initial={false}>
                {feed.map((f) => {
                  const meta = EVENT_META[f.event];
                  const time = new Date(f.at).toLocaleTimeString("en-IN", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  return (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, x: -12, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      className="flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-[12.5px] hover:bg-surface-2"
                    >
                      <span className="text-muted-2">{time}</span>
                      <span
                        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: meta?.color }}
                      />
                      <span style={{ color: meta?.color }} className="font-medium">
                        {meta?.label}
                      </span>
                      <span className="text-muted">·</span>
                      <span className="truncate text-ink">{f.customer}</span>
                      <span className="ml-auto text-muted-2">
                        {CHANNEL_META[f.channel]?.label}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {feed.length === 0 && (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> Waiting for the
                  channel service to report back…
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats + funnel + revenue */}
        <div className="col-span-5 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <MiniStat
              label="Orders driven"
              value={campaign ? String(campaign.attributedOrders) : "—"}
              color="#00E5A0"
            />
            <MiniStat
              label="Attributed revenue"
              value={campaign ? inrFull(campaign.attributedRevenue) : "—"}
              color="#00E5A0"
            />
          </div>

          <div className="card p-6">
            <div className="label mb-4">Engagement funnel</div>
            <div className="space-y-3">
              {funnel.map((s) => (
                <div key={s.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted">{s.label}</span>
                    <span className="font-display font-bold text-ink">{s.value}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      animate={{ width: `${(s.value / maxFunnel) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ background: s.color }}
                    />
                  </div>
                </div>
              ))}
              {campaign && campaign.failedCount > 0 && (
                <div className="flex items-center justify-between pt-1 text-sm">
                  <span className="text-danger">Failed</span>
                  <span className="font-display font-bold text-danger">
                    {campaign.failedCount}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* AI insight on completion */}
          <AnimatePresence>
            {campaign?.insight && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card border-live/20 bg-live/[0.04] p-5"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-live" />
                  <span className="label text-live">AI campaign insight</span>
                </div>
                <p className="text-sm leading-relaxed text-ink">{campaign.insight}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-5">
      <div className="label mb-2">{label}</div>
      <div className="font-display text-2xl font-extrabold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
