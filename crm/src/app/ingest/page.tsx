"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, UserPlus, CheckCircle2, Download, Loader2, Database } from "lucide-react";

type IngestResult = { created: number; updated: number; ordersAdded: number };

export default function IngestPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"csv" | "manual" | "api">("csv");

  return (
    <div className="px-10 py-12">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <Database className="h-4 w-4 text-primary-soft" />
          <span className="label">Data Ingestion</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          Bring your shoppers in
        </h1>
        <p className="mt-1 max-w-2xl text-muted">
          Import customers and orders by uploading a CSV, adding them by hand, or
          pushing data into the ingestion API. New shoppers are matched by email,
          so re-importing updates instead of duplicating.
        </p>
      </div>

      <div className="mb-7 flex gap-2">
        {[
          { id: "csv", label: "CSV Upload", icon: Upload },
          { id: "manual", label: "Add Manually", icon: UserPlus },
          { id: "api", label: "Via API", icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id as typeof tab)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "border-primary bg-primary/15 text-ink"
                  : "border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-2xl">
        {tab === "csv" && <CsvUpload onDone={() => router.refresh()} />}
        {tab === "manual" && <ManualAdd onDone={() => router.refresh()} />}
        {tab === "api" && <ApiDocs />}
      </div>
    </div>
  );
}

function CsvUpload({ onDone }: { onDone: () => void }) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError("");
    setResult(null);
    setFileName(file.name);
    setBusy(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setResult(data);
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`card flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed p-12 text-center transition-all ${
          dragging ? "border-primary bg-primary/10" : "border-line hover:border-primary/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {busy ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary-soft" />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15">
            <Upload className="h-6 w-6 text-primary-soft" />
          </div>
        )}
        <div>
          <div className="font-display text-lg font-bold text-ink">
            {busy ? "Importing…" : "Drop your CSV here"}
          </div>
          <div className="mt-1 text-sm text-muted">
            {fileName || "or click to browse · columns: name, email, phone, city"}
          </div>
        </div>
      </div>

      <a
        href="/sample-customers.csv"
        download
        className="inline-flex items-center gap-2 text-sm text-primary-soft hover:underline"
      >
        <Download className="h-4 w-4" /> Download a sample CSV to try
      </a>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border-live/30 bg-live/[0.05] p-5"
          >
            <div className="flex items-center gap-2 text-live">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-display font-bold">Import complete</span>
            </div>
            <p className="mt-2 text-sm text-ink">
              {result.created} new shoppers added, {result.updated} updated
              {result.ordersAdded > 0 ? `, ${result.ordersAdded} orders recorded` : ""}.
              They're now in your Shoppers list.
            </p>
          </motion.div>
        )}
        {error && (
          <div className="card border-danger/30 bg-danger/[0.05] p-4 text-sm text-danger">
            {error}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ManualAdd({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<string | null>(null);

  async function submit() {
    if (!form.name || !form.email) return;
    setBusy(true);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customers: [form] }),
      });
      if (res.ok) {
        setAdded(form.name);
        setForm({ name: "", email: "", phone: "", city: "" });
        onDone();
        setTimeout(() => setAdded(null), 4000);
      }
    } finally {
      setBusy(false);
    }
  }

  const field = (key: keyof typeof form, label: string, placeholder: string) => (
    <div>
      <label className="label mb-1.5 block">{label}</label>
      <input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
      />
    </div>
  );

  return (
    <div className="card p-6">
      <div className="grid grid-cols-2 gap-4">
        {field("name", "Name *", "Priya Sharma")}
        {field("email", "Email *", "priya@example.com")}
        {field("phone", "Phone", "+91 98765 43210")}
        {field("city", "City", "Mumbai")}
      </div>
      <button onClick={submit} disabled={!form.name || !form.email || busy} className="btn-primary mt-5">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Add shopper
      </button>
      <AnimatePresence>
        {added && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-2 text-sm text-live"
          >
            <CheckCircle2 className="h-4 w-4" /> {added} added to your shopper base.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ApiDocs() {
  const curl = `curl -X POST http://localhost:3000/api/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "customers": [
      { "name": "Asha Rao", "email": "asha@example.com", "city": "Pune" }
    ],
    "orders": [
      { "customerEmail": "asha@example.com", "category": "Sarees", "amount": 3200 }
    ]
  }'`;
  return (
    <div className="card p-6">
      <p className="mb-4 text-sm text-muted">
        A real brand's backend would push data here. The endpoint accepts JSON
        (customers and orders) or a raw CSV body. Customers are matched by email
        so repeated calls update rather than duplicate.
      </p>
      <div className="overflow-x-auto rounded-lg bg-surface-2 p-4">
        <pre className="font-mono text-xs leading-relaxed text-ink">{curl}</pre>
      </div>
      <div className="mt-4 space-y-1 text-xs text-muted">
        <div><span className="text-ink">POST</span> /api/ingest</div>
        <div>Content-Type: application/json <span className="text-muted-2">or</span> text/csv</div>
      </div>
    </div>
  );
}
