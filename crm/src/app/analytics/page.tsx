"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import { BarChart3, TrendingUp, MousePointerClick, ShoppingBag } from "lucide-react";
import { inrFull } from "@/lib/format";

type Campaign = {
  id: string;
  name: string;
  channel: string;
  deliveredCount: number;
  readCount: number;
  clickedCount: number;
  attributedOrders: number;
  attributedRevenue: number;
};

export default function AnalyticsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns || []));
  }, []);

  const totalRevenue = campaigns.reduce((s, c) => s + c.attributedRevenue, 0);
  const totalOrders = campaigns.reduce((s, c) => s + c.attributedOrders, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clickedCount, 0);
  const totalDelivered = campaigns.reduce((s, c) => s + c.deliveredCount, 0);

  const chartData = campaigns
    .filter((c) => c.attributedRevenue > 0)
    .slice(0, 8)
    .map((c) => ({
      name: c.name.length > 16 ? c.name.slice(0, 16) + "…" : c.name,
      revenue: Math.round(c.attributedRevenue),
    }));

  return (
    <div className="px-10 py-12">
      <div className="mb-7">
        <div className="mb-1 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary-soft" />
          <span className="label">Performance</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          Analytics
        </h1>
        <p className="mt-1 text-muted">
          Revenue attribution across every campaign — from message to money.
        </p>
      </div>

      <div className="mb-7 grid grid-cols-4 gap-4">
        <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Attributed revenue" value={inrFull(totalRevenue)} accent />
        <Kpi icon={<ShoppingBag className="h-4 w-4" />} label="Orders driven" value={String(totalOrders)} />
        <Kpi icon={<MousePointerClick className="h-4 w-4" />} label="Total clicks" value={String(totalClicks)} />
        <Kpi
          icon={<BarChart3 className="h-4 w-4" />}
          label="Click rate"
          value={totalDelivered ? `${Math.round((totalClicks / totalDelivered) * 100)}%` : "—"}
        />
      </div>

      <div className="card p-6">
        <div className="label mb-5">Revenue by campaign</div>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-14 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15">
              <BarChart3 className="h-6 w-6 text-primary-soft" />
            </div>
            <div>
              <div className="font-display text-lg font-bold text-ink">No campaign data yet</div>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                This page fills with revenue and engagement once you launch a campaign
                and the channel service reports orders back. Launch one to see it light up.
              </p>
            </div>
            <a href="/campaigns/new" className="btn-primary">Launch your first campaign</a>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: "#6B6880", fontSize: 12 }}
                axisLine={{ stroke: "#262634" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6B6880", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: "rgba(124,106,247,0.08)" }}
                contentStyle={{
                  background: "#12121A",
                  border: "1px solid #262634",
                  borderRadius: 12,
                  color: "#F0EEF8",
                }}
                formatter={(v: number) => [inrFull(v), "Revenue"]}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill="#7C6AF7" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2 text-muted">
        <span className={accent ? "text-live" : "text-primary-soft"}>{icon}</span>
        <span className="label">{label}</span>
      </div>
      <div className={`font-display text-2xl font-extrabold ${accent ? "text-live" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}
