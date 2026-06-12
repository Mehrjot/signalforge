"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Layers,
  Sparkles,
  Radio,
  BarChart3,
  BookOpen,
  Database,
  HelpCircle,
  LifeBuoy,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";

const nav = [
  { href: "/", label: "Command", icon: LayoutDashboard },
  { href: "/ingest", label: "Ingest", icon: Database },
  { href: "/customers", label: "Shoppers", icon: Users },
  { href: "/audiences", label: "Audiences", icon: Layers },
  { href: "/campaigns/new", label: "New Campaign", icon: Sparkles },
  { href: "/campaigns", label: "War Room", icon: Radio },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/blog", label: "Learn", icon: BookOpen },
  { href: "/support", label: "Support", icon: LifeBuoy },
];

function startTour() {
  window.dispatchEvent(new Event("signalforge:start-tour"));
}

export default function Sidebar() {
  const path = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <aside className="sticky top-0 flex h-screen w-[230px] shrink-0 flex-col border-r border-line bg-surface/60 px-4 py-6 backdrop-blur">
      <Link href="/" className="mb-9 flex items-center gap-2.5 px-2">
        <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary">
          <Sparkles className="h-4 w-4 text-white" />
          <span className="absolute inset-0 rounded-xl ring-1 ring-primary/50" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-[15px] font-extrabold tracking-tight text-ink">
            SignalForge
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
            Marketing OS
          </div>
        </div>
      </Link>

      <nav className="flex flex-col gap-1">
        {nav.map((item) => {
          const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                active ? "bg-primary/15 text-ink" : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] ${
                  active ? "text-primary-soft" : "text-muted group-hover:text-ink"
                }`}
              />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <button
          onClick={startTour}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-all hover:bg-surface-2 hover:text-ink"
        >
          <HelpCircle className="h-[18px] w-[18px]" /> Restart tour
        </button>
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-all hover:bg-surface-2 hover:text-ink"
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-[18px] w-[18px]" /> Light mode
            </>
          ) : (
            <>
              <Moon className="h-[18px] w-[18px]" /> Dark mode
            </>
          )}
        </button>
        <div className="card-2 p-3">
          <div className="label mb-1">Demo Brand</div>
          <p className="text-xs leading-relaxed text-muted">
            SignalForge — a fictional D2C ethnic-wear label. All shoppers & orders are simulated.
          </p>
        </div>
      </div>
    </aside>
  );
}
