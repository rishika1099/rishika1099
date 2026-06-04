"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { domainColor, type Domain } from "@/data/projects";
import type { Doc } from "@/lib/content";

// one friendly date style for every post (local + Substack)
const fmtDate = (raw: string) => {
  // bare YYYY-MM-DD parses as UTC midnight, which can render a day early in
  // US timezones, so pin it to local noon before formatting
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T12:00:00`)
    : new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

// the tech areas a post is tagged with (domains stay as chips, not filters)
const techOf = (p: Doc): string[] => [...new Set(p.tech ?? [])];

export default function TechnicalBlogList({ posts }: { posts: Doc[] }) {
  const [active, setActive] = useState<string>("All");

  // filter only by technical area, sorted by how often each appears (popular first)
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of techOf(p)) counts.set(t, (counts.get(t) ?? 0) + 1);
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);

  const shown =
    active === "All" ? posts : posts.filter((p) => techOf(p).includes(active));

  return (
    <>
      {tags.length > 1 && (
        <div className="mt-6">
          <h2 className="font-body text-sm font-semibold text-ink-soft">
            🔖 filter by topic
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {["All", ...tags].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActive(t)}
                className={`rounded-full px-4 py-1.5 font-body text-sm font-semibold transition ${
                  active === t
                    ? "bg-ink text-cream"
                    : "bg-white/70 text-ink-soft hover:bg-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {posts.length === 0 && (
          <p className="font-hand text-xl text-ink-soft">
            no posts yet, they&apos;re still brewing ☕
          </p>
        )}
        <AnimatePresence mode="popLayout">
          {shown.map((p) => {
            const cardClass =
              "block rounded-3xl p-6 soft-card transition hover:-translate-y-1";
            const inner = (
              <>
                <p className="font-body text-sm italic text-ink-soft">{fmtDate(p.date)}</p>
                <h2 className="font-display text-xl font-semibold text-ink">{p.title}</h2>
                <p className="mt-1 font-body text-sm text-ink-soft">{p.excerpt}</p>
                {Boolean(p.domains?.length || p.tech?.length) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.domains?.map((d) => (
                      <span
                        key={d}
                        style={{ backgroundColor: domainColor[d as Domain] }}
                        className="rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink"
                      >
                        {d}
                      </span>
                    ))}
                    {p.tech
                      ?.filter((t) => !p.domains?.some((d) => d === t))
                      .map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-mint/70 px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink-soft"
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                )}
                <span className="mt-3 inline-block font-body text-sm font-semibold text-[#c77dba]">
                  {p.external ? "read on Substack ↗" : "read on →"}
                </span>
              </>
            );
            return (
              <motion.div
                layout
                key={p.slug}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.22 }}
              >
                {p.external ? (
                  <a href={p.external} target="_blank" rel="noreferrer" className={cardClass}>
                    {inner}
                  </a>
                ) : (
                  <Link href={`/blog/technical/${p.slug}`} className={cardClass}>
                    {inner}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {shown.length === 0 && posts.length > 0 && (
          <p className="font-hand text-xl text-ink-soft">
            nothing under &ldquo;{active}&rdquo; yet ✦
          </p>
        )}
      </div>
    </>
  );
}
