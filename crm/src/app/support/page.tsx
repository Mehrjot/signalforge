"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LifeBuoy,
  MessageSquare,
  Mail,
  ChevronDown,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react";

const faqs = [
  {
    q: "Why is my Analytics page showing zeros?",
    a: "Analytics fills up after you launch a campaign and it completes. Go to New Campaign, describe a goal, launch it, and watch the War Room. Once messages are delivered and orders come in, Analytics updates automatically.",
  },
  {
    q: "Are real WhatsApp or email messages being sent?",
    a: "No — and this is by design. The channel service simulates the full delivery lifecycle (sent → delivered → read → clicked → converted) without contacting any real phone numbers or email addresses. This mirrors how real messaging providers work, without the cost or side-effects.",
  },
  {
    q: "What happens when I import a CSV? Does it replace my existing shoppers?",
    a: "No, it adds to them. Shoppers are matched by email address. If the email already exists, the record is updated. If it's new, a fresh shopper is created. Your existing base is never overwritten.",
  },
  {
    q: "How do I enable real AI instead of heuristic mode?",
    a: "Add a free Gemini API key to crm/.env as GEMINI_API_KEY. Get one at aistudio.google.com — no credit card needed. Then restart the CRM with npm run dev. The header will switch to 'AI engine live'.",
  },
  {
    q: "What's the difference between Audiences and Shoppers?",
    a: "Shoppers is the full list of every individual customer. Audiences groups them into behavioural segments (Champions, At Risk, Loyal, Newcomers, Dormant) based on their spend, recency and order frequency — so you can target a whole behaviour type in one click.",
  },
  {
    q: "Can I use this platform for any type of brand?",
    a: "Yes. The demo is set up for a D2C ethnic-wear label, but the platform is generic. The only brand-specific content is the simulated customer data. Any retail or D2C brand — fashion, coffee, beauty, electronics — can use SignalForge without changing the product.",
  },
  {
    q: "What does the War Room show?",
    a: "The War Room streams live delivery events for an active campaign — every 'sent', 'delivered', 'read', 'clicked', and 'order placed' event as it happens. It's powered by a real-time connection to the server so the feed updates without refreshing.",
  },
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function handleSubmit() {
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    // Simulate a form submission (no real backend needed for a CRM demo).
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 1200);
  }

  const field = (
    key: keyof typeof form,
    label: string,
    placeholder: string,
    multiline = false
  ) => (
    <div>
      <label className="label mb-1.5 block">{label}</label>
      {multiline ? (
        <textarea
          rows={4}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full resize-none rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
        />
      ) : (
        <input
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
        />
      )}
    </div>
  );

  return (
    <div className="px-10 py-12">
      <div className="mb-10">
        <div className="mb-1 flex items-center gap-2">
          <LifeBuoy className="h-4 w-4 text-primary-soft" />
          <span className="label">Help & Support</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          We're here to help
        </h1>
        <p className="mt-1 max-w-2xl text-muted">
          Questions about your campaigns, data, or how SignalForge works? Reach
          the Xeno support team directly, or browse common questions below.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left — contact form */}
        <div className="col-span-7">
          <div className="card p-7">
            <h2 className="font-display text-lg font-bold text-ink mb-5">
              Send us a message
            </h2>

            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3 py-10 text-center"
                >
                  <CheckCircle2 className="h-10 w-10 text-live" />
                  <div className="font-display text-lg font-bold text-ink">
                    Message received
                  </div>
                  <p className="text-sm text-muted">
                    The Xeno team typically responds within one business day.
                    You'll hear back at {form.email}.
                  </p>
                  <button
                    onClick={() => {
                      setSent(false);
                      setForm({ name: "", email: "", subject: "", message: "" });
                    }}
                    className="btn-ghost mt-2"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    {field("name", "Your name *", "Priya Sharma")}
                    {field("email", "Email *", "priya@brand.com")}
                  </div>
                  {field("subject", "Subject", "Question about campaign analytics")}
                  {field(
                    "message",
                    "Message *",
                    "Hi, I was wondering about...",
                    true
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={!form.name || !form.email || !form.message || sending}
                    className="btn-primary"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                    {sending ? "Sending…" : "Send message"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right — contact channels + xeno info */}
        <div className="col-span-5 space-y-4">
          <div className="card p-5">
            <div className="label mb-3">Direct contact</div>
            <div className="space-y-3">
              <ContactRow
                icon={<Mail className="h-4 w-4" />}
                label="Email support"
                value="support@xeno.ai"
                href="mailto:support@xeno.ai"
              />
              <ContactRow
                icon={<MessageSquare className="h-4 w-4" />}
                label="WhatsApp"
                value="+91 98765 00000"
                href="https://wa.me/919876500000"
              />
              <ContactRow
                icon={<ExternalLink className="h-4 w-4" />}
                label="Xeno website"
                value="xeno.ai"
                href="https://xeno.ai"
              />
            </div>
          </div>

          <div className="card p-5">
            <div className="label mb-2">About Xeno</div>
            <p className="text-sm leading-relaxed text-muted">
              Xeno helps consumer brands reach their shoppers in meaningful,
              data-driven ways — organising customer data, deciding who to talk
              to, and running personalised campaigns across WhatsApp, SMS, Email
              and RCS.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              SignalForge is powered by Xeno's platform. Your account team is
              available Monday–Friday, 9am–6pm IST.
            </p>
          </div>

          <div className="card p-5">
            <div className="label mb-2">Response times</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">General questions</span>
                <span className="text-ink">Within 1 business day</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Campaign issues</span>
                <span className="text-ink">Within 4 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Urgent / outage</span>
                <span className="text-live">Within 1 hour</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="font-display text-xl font-bold text-ink mb-5">
          Frequently asked questions
        </h2>
        <div className="max-w-3xl space-y-2">
          {faqs.map((faq, i) => (
            <motion.div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-ink">{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                    openFaq === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="border-t border-line px-5 py-4 text-sm leading-relaxed text-muted">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-2"
    >
      <span className="text-primary-soft">{icon}</span>
      <div>
        <div className="text-xs text-muted">{label}</div>
        <div className="text-sm font-medium text-ink">{value}</div>
      </div>
      <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-2" />
    </a>
  );
}
