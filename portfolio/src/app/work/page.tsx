"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import { projects, categories, type Category, type Project } from "@/data/projects";

function Links({ p }: { p: Project }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <a
        href={p.repo}
        target="_blank"
        rel="noreferrer"
        className="rounded-full bg-ink/90 px-3 py-1 font-body text-xs font-semibold text-cream transition hover:scale-105"
      >
        ⭑ Code
      </a>
      {p.demo && (
        <a
          href={p.demo}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-blush/80 px-3 py-1 font-body text-xs font-semibold text-ink transition hover:scale-105"
        >
          ✿ Live demo
        </a>
      )}
    </div>
  );
}

function Tags({ tags }: { tags: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <span
          key={t}
          className="rounded-full bg-mint/60 px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink-soft"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export default function Work() {
  const [filter, setFilter] = useState<Category | "All">("All");
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter(
    (p) => !p.featured && (filter === "All" || p.category === filter)
  );

  return (
    <PageShell vibe="meadow">
      <PageTitle>my little meadow of projects 🌱</PageTitle>
      <p className="mt-3 max-w-2xl font-body text-lg text-ink-soft">
        31 things I&apos;ve grown, from clinical LLM systems to causal studies
        to weekend ML experiments. The big blooms are below; pick a patch to
        wander through the rest.
      </p>

      {/* Featured */}
      <h2 className="mt-10 font-display text-2xl font-semibold text-ink">
        ⭐ featured blooms
      </h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {featured.map((p, i) => (
          <motion.article
            key={p.name}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -6, rotate: i % 2 ? 1 : -1 }}
            className="rounded-3xl p-6 soft-card"
          >
            <span className="animate-float-med text-4xl">{p.emoji}</span>
            <h3 className="mt-2 font-display text-xl font-semibold text-ink">
              {p.name}
            </h3>
            <p className="mt-1.5 font-body text-sm text-ink-soft">{p.blurb}</p>
            <Tags tags={p.tags} />
            <Links p={p} />
          </motion.article>
        ))}
      </div>

      {/* Filters */}
      <h2 className="mt-12 font-display text-2xl font-semibold text-ink">
        wander the patches
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["All", ...categories] as const).map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full px-4 py-1.5 font-body text-sm font-semibold transition ${
              filter === c
                ? "bg-ink text-cream"
                : "bg-white/70 text-ink-soft hover:bg-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {rest.map((p) => (
            <motion.article
              layout
              key={p.name}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              whileHover={{ y: -5 }}
              className="rounded-3xl p-5 soft-card"
            >
              <span className="text-3xl">{p.emoji}</span>
              <h3 className="mt-1.5 font-display text-base font-semibold text-ink">
                {p.name}
              </h3>
              <p className="mt-1 font-body text-sm text-ink-soft">{p.blurb}</p>
              <Tags tags={p.tags} />
              <Links p={p} />
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
