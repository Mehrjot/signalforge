"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, X, Sparkles } from "lucide-react";

// A first-visit guided tour. Each step explains one part of the workflow so a
// new user understands the loop: ingest -> segment -> launch -> watch -> learn.
// We persist completion in localStorage so it only shows once (a Restart Tour
// control lives in the sidebar for demos).

type Step = {
  title: string;
  body: string;
  route?: string;
};

const steps: Step[] = [
  {
    title: "Welcome to SignalForge",
    body: "An AI marketing operating system. You describe a goal in plain English, and it decides who to message, what to say, and which channel to use — then runs the campaign and reports back. This quick tour shows the flow.",
  },
  {
    title: "1 · Bring in your data",
    body: "Start in Ingest. Upload a CSV of shoppers, add them by hand, or push data via the API. A demo set is already loaded so you can explore right away.",
    route: "/ingest",
  },
  {
    title: "2 · See who you're talking to",
    body: "Shoppers lists every customer. Click anyone to open their AI Digital Twin — a generated profile of how they buy and which channel reaches them.",
    route: "/customers",
  },
  {
    title: "3 · Let the AI group them",
    body: "Audiences auto-segments your base into Champions, At-Risk, Loyal, Newcomers and Dormant — each one ready to target in a click.",
    route: "/audiences",
  },
  {
    title: "4 · Launch a campaign",
    body: "This is the heart of it. Type a goal like 'win back lapsed customers'. The AI builds the audience, writes a personal message for each shopper, and projects revenue per channel before you send.",
    route: "/campaigns/new",
  },
  {
    title: "5 · Watch it happen live",
    body: "After launching, the War Room streams every delivery event in real time — sent, delivered, read, clicked, order placed — as the channel service reports back.",
    route: "/campaigns",
  },
  {
    title: "6 · Measure the impact",
    body: "Analytics ties orders back to the campaigns that drove them, so you see real revenue — not just open rates. These screens fill up once your first campaign runs.",
    route: "/analytics",
  },
  {
    title: "You're set",
    body: "Tip: the fastest way to see everything light up is to launch one campaign from New Campaign, then open the War Room. Have a look around.",
  },
];

export default function OnboardingTour() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = window.localStorage.getItem("signalforge-tour-done");
    if (!seen) setActive(true);

    const handler = () => {
      setStep(0);
      setActive(true);
    };
    window.addEventListener("signalforge:start-tour", handler);
    return () => window.removeEventListener("signalforge:start-tour", handler);
  }, []);

  function finish() {
    window.localStorage.setItem("signalforge-tour-done", "1");
    setActive(false);
  }

  function next() {
    const n = step + 1;
    if (n >= steps.length) return finish();
    setStep(n);
    if (steps[n].route) router.push(steps[n].route!);
  }

  if (!active) return null;
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="card relative mx-4 w-full max-w-md p-7"
        >
          <button
            onClick={finish}
            className="absolute right-4 top-4 text-muted hover:text-ink"
            aria-label="Skip tour"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-4 flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary-soft" />
            </div>
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-5 bg-primary" : "w-1.5 bg-line"
                  }`}
                />
              ))}
            </div>
          </div>

          <h2 className="font-display text-xl font-bold text-ink">{current.title}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{current.body}</p>

          <div className="mt-6 flex items-center justify-between">
            <button onClick={finish} className="text-sm text-muted hover:text-ink">
              Skip tour
            </button>
            <button onClick={next} className="btn-primary">
              {isLast ? "Start exploring" : "Next"}
              {!isLast && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
