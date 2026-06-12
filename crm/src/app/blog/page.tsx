"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
import { blogs } from "@/lib/blogs";

export default function BlogList() {
  const featured = blogs[0];
  const rest = blogs.slice(1);

  return (
    <div className="px-10 py-12">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary-soft" />
          <span className="label">Learn</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
          The SignalForge field guide
        </h1>
        <p className="mt-1 max-w-2xl text-muted">
          Short, opinionated reads on retention, channels, attribution and building
          AI-native marketing — the thinking behind how this product works.
        </p>
      </div>

      {/* Featured */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href={`/blog/${featured.slug}`}
          className="group card mb-6 flex flex-col gap-5 overflow-hidden p-8 transition-all hover:border-primary/40 md:flex-row md:items-center"
        >
          <div className="grid h-28 w-28 shrink-0 place-items-center rounded-2xl bg-primary/12 text-6xl">
            {featured.cover}
          </div>
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <span className="chip border-primary/30 text-primary-soft">Featured</span>
              <span className="chip">{featured.category}</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-ink">{featured.title}</h2>
            <p className="mt-2 max-w-2xl text-muted">{featured.excerpt}</p>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary-soft">
              Read article
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {rest.map((b, i) => (
          <motion.div
            key={b.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Link
              href={`/blog/${b.slug}`}
              className="group card flex h-full flex-col p-6 transition-all hover:border-primary/40 hover:bg-surface-2"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-surface-2 text-2xl">
                  {b.cover}
                </div>
                <span className="chip">{b.category}</span>
              </div>
              <h3 className="font-display text-lg font-bold leading-snug text-ink">
                {b.title}
              </h3>
              <p className="mt-2 flex-1 text-sm text-muted">{b.excerpt}</p>
              <div className="mt-4 flex items-center gap-3 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {b.readMins} min read
                </span>
                <span>
                  {new Date(b.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
