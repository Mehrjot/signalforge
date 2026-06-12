"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Sparkles, Loader2, X, Brain } from "lucide-react";
import { inrFull, CHANNEL_META } from "@/lib/format";

type Order = { id: string; category: string; amount: number; placedAt: string; items: string[] };
type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  topCategory: string;
  totalSpend: number;
  orderCount: number;
  daysSinceLastOrder: number | null;
  whatsappScore: number;
  emailScore: number;
  smsScore: number;
  twinSummary: string | null;
  twinTraits: string[];
  reason: string;
  confidence: number;
  orders: Order[];
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((d) => {
        setCustomers(d.customers || []);
        setLoading(false);
      });
  }
  useEffect(load, []);

  return (
    <div className="px-10 py-12">
      <div className="mb-7">
        <div className="mb-1 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary-soft" />
          <span className="label">Shopper base</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          Shoppers
        </h1>
        <p className="mt-1 text-muted">
          Click any shopper to open their AI Digital Twin.
        </p>
      </div>

      {loading ? (
        <div className="py-10 text-muted">Loading…</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 border-b border-line px-5 py-3">
            <span className="label">Shopper</span>
            <span className="label">Top category</span>
            <span className="label text-right">Lifetime spend</span>
            <span className="label text-right">Last order</span>
            <span className="label">Twin</span>
          </div>
          <div className="divide-y divide-line">
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className="grid w-full grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-surface-2"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-xs font-bold text-primary-soft">
                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-ink">{c.name}</div>
                    <div className="text-xs text-muted">{c.city}</div>
                  </div>
                </div>
                <span className="text-sm text-muted">{c.topCategory}</span>
                <span className="text-right font-display text-sm font-bold text-ink">
                  {inrFull(c.totalSpend)}
                </span>
                <span className="text-right text-sm text-muted">
                  {c.daysSinceLastOrder == null ? "—" : `${c.daysSinceLastOrder}d ago`}
                </span>
                <span>
                  {c.twinSummary ? (
                    <span className="chip border-live/30 text-live">
                      <Brain className="h-3 w-3" /> ready
                    </span>
                  ) : (
                    <span className="chip">generate</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <TwinPanel
            customer={selected}
            onClose={() => setSelected(null)}
            onTwinGenerated={(twin) => {
              setSelected({ ...selected, twinSummary: twin.summary, twinTraits: twin.traits });
              setCustomers((prev) =>
                prev.map((c) =>
                  c.id === selected.id
                    ? { ...c, twinSummary: twin.summary, twinTraits: twin.traits }
                    : c
                )
              );
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TwinPanel({
  customer,
  onClose,
  onTwinGenerated,
}: {
  customer: Customer;
  onClose: () => void;
  onTwinGenerated: (t: { summary: string; traits: string[] }) => void;
}) {
  const [generating, setGenerating] = useState(false);

  async function generate() {
    setGenerating(true);
    const twin = await fetch(`/api/customers/${customer.id}/twin`, {
      method: "POST",
    }).then((r) => r.json());
    onTwinGenerated(twin);
    setGenerating(false);
  }

  const channels = [
    { key: "whatsapp", score: customer.whatsappScore },
    { key: "email", score: customer.emailScore },
    { key: "sms", score: customer.smsScore },
  ].sort((a, b) => b.score - a.score);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 z-50 h-full w-[440px] overflow-y-auto border-l border-line bg-surface p-7"
      >
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 font-display text-base font-bold text-primary-soft">
              {customer.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="font-display text-xl font-bold text-ink">
                {customer.name}
              </div>
              <div className="text-sm text-muted">
                {customer.city} · {customer.phone}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Digital Twin */}
        <div className="card-2 mb-5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 label text-primary-soft">
              <Brain className="h-3.5 w-3.5" /> AI Digital Twin
            </span>
            {customer.twinSummary && (
              <button
                onClick={generate}
                disabled={generating}
                className="text-[11px] text-muted hover:text-ink"
              >
                regenerate
              </button>
            )}
          </div>
          {customer.twinSummary ? (
            <>
              <p className="text-sm leading-relaxed text-ink">
                {customer.twinSummary}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {customer.twinTraits.map((t) => (
                  <span key={t} className="chip border-primary/30 text-primary-soft">
                    {t}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <button
              onClick={generate}
              disabled={generating}
              className="btn-primary w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Building twin…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate Digital Twin
                </>
              )}
            </button>
          )}
        </div>

        {/* Why selected / explainability */}
        <div className="card-2 mb-5 p-4">
          <div className="label mb-2">Engagement signals</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Sig label="Spend" value={inrFull(customer.totalSpend)} />
            <Sig label="Orders" value={String(customer.orderCount)} />
            <Sig
              label="Last order"
              value={
                customer.daysSinceLastOrder == null
                  ? "—"
                  : `${customer.daysSinceLastOrder}d`
              }
            />
          </div>
        </div>

        {/* Channel affinity */}
        <div className="card-2 mb-5 p-4">
          <div className="label mb-3">Channel affinity</div>
          <div className="space-y-2.5">
            {channels.map((ch) => (
              <div key={ch.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted">{CHANNEL_META[ch.key].label}</span>
                  <span className="font-display font-bold text-ink">{ch.score}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${ch.score}%`,
                      background: CHANNEL_META[ch.key].color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order history */}
        <div className="card-2 p-4">
          <div className="label mb-3">Order history</div>
          <div className="space-y-2">
            {customer.orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="text-ink">{o.items.join(", ")}</div>
                  <div className="text-xs text-muted">
                    {o.category} ·{" "}
                    {new Date(o.placedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}
                  </div>
                </div>
                <span className="font-display font-bold text-ink">
                  {inrFull(o.amount)}
                </span>
              </div>
            ))}
            {customer.orders.length === 0 && (
              <div className="text-sm text-muted">No orders yet.</div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

function Sig({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-base font-bold text-ink">{value}</div>
      <div className="label mt-0.5">{label}</div>
    </div>
  );
}
