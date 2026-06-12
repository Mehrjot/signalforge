"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, ArrowRight, Sparkles, Plus } from "lucide-react";
import { inrFull } from "@/lib/format";

type Campaign = {
  id: string;
  name: string;
  status: string;
  channel: string;
  audienceSize: number;
  deliveredCount: number;
  clickedCount: number;
  attributedRevenue: number;
  attributedOrders: number;
  createdAt: string;
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => {
        setCampaigns(d.campaigns || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="px-10 py-12">
      <div className="mb-7 flex items-end justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Radio className="h-4 w-4 text-primary-soft" />
            <span className="label">War Room</span>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            Campaigns
          </h1>
        </div>
        <Link href="/campaigns/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New campaign
        </Link>
      </div>

      {loading ? (
        <div className="py-10 text-muted">Loading…</div>
      ) : campaigns.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 p-14 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15">
            <Sparkles className="h-6 w-6 text-primary-soft" />
          </div>
          <div>
            <div className="font-display text-lg font-bold text-ink">
              No campaigns yet
            </div>
            <p className="mt-1 text-sm text-muted">
              Launch your first AI-built campaign from the Command Center or
              start fresh.
            </p>
          </div>
          <Link href="/campaigns/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Build a campaign
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="group card flex items-center gap-6 p-5 transition-all hover:border-primary/40 hover:bg-surface-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`chip ${
                      c.status === "completed"
                        ? "border-live/30 text-live"
                        : c.status === "live"
                        ? "border-primary/30 text-primary-soft"
                        : ""
                    }`}
                  >
                    {c.status}
                  </span>
                  <span className="label">
                    {new Date(c.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="mt-1.5 font-display text-lg font-bold text-ink">
                  {c.name}
                </div>
              </div>
              <Metric label="Audience" value={String(c.audienceSize)} />
              <Metric label="Clicked" value={String(c.clickedCount)} />
              <Metric label="Orders" value={String(c.attributedOrders)} />
              <Metric
                label="Revenue"
                value={inrFull(c.attributedRevenue)}
                accent
              />
              <ArrowRight className="h-5 w-5 text-muted transition-all group-hover:translate-x-1 group-hover:text-primary-soft" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="shrink-0 text-right">
      <div className="label">{label}</div>
      <div
        className={`font-display text-base font-bold ${
          accent ? "text-live" : "text-ink"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
