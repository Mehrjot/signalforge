"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";
import { getBlog, blogs } from "@/lib/blogs";

export default function BlogReader() {
  const params = useParams();
  const slug = String(params.slug);
  const blog = getBlog(slug);

  if (!blog) {
    return (
      <div className="px-10 py-12">
        <p className="text-muted">Article not found.</p>
        <Link href="/blog" className="mt-4 inline-block text-primary-soft">
          ← Back to all articles
        </Link>
      </div>
    );
  }

  const others = blogs.filter((b) => b.slug !== slug).slice(0, 2);

  return (
    <div className="px-10 py-10">
      <Link
        href="/blog"
        className="mb-7 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> All articles
      </Link>

      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl"
      >
        <div className="mb-5 flex items-center gap-2">
          <span className="chip">{blog.category}</span>
          <span className="flex items-center gap-1 text-xs text-muted">
            <Clock className="h-3 w-3" /> {blog.readMins} min read
          </span>
          <span className="text-xs text-muted">
            {new Date(blog.date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary/12 text-4xl">
            {blog.cover}
          </div>
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-ink">
            {blog.title}
          </h1>
        </div>

        <p className="mb-8 border-l-2 border-primary pl-4 text-lg italic text-muted">
          {blog.excerpt}
        </p>

        <div className="space-y-5">
          {blog.body.map((para, i) => (
            <p key={i} className="text-[16px] leading-[1.75] text-ink/90">
              {para}
            </p>
          ))}
        </div>
      </motion.article>

      {/* Keep reading */}
      <div className="mx-auto mt-14 max-w-2xl border-t border-line pt-8">
        <div className="label mb-4">Keep reading</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {others.map((b) => (
            <Link
              key={b.slug}
              href={`/blog/${b.slug}`}
              className="group card flex items-center gap-3 p-4 transition-all hover:border-primary/40"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-2 text-xl">
                {b.cover}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">{b.title}</div>
                <div className="text-xs text-muted">{b.readMins} min read</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
