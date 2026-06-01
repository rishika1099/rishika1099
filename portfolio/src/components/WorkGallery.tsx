"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  domainColor,
  type Category,
  type Domain,
  type Project,
} from "@/data/projects";

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

function DomainChips({ domains }: { domains?: Domain[] }) {
  if (!domains?.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {domains.map((d) => (
        <span
          key={d}
          style={{ backgroundColor: domainColor[d] }}
          className="rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink"
        >
          {d}
        </span>
      ))}
    </div>
  );
}

function TechChips({ categories }: { categories: Category[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {categories.map((c) => (
        <span
          key={c}
          className="rounded-full bg-mint/70 px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink-soft"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

export default function WorkGallery({
  projects,
  categories,
  domains,
}: {
  projects: Project[];
  categories: Category[];
  domains: Domain[];
}) {
  const [filter, setFilter] = useState<Category | "All">("All");
  const [domain, setDomain] = useState<Domain | "All">("All");

  const filtering = filter !== "All" || domain !== "All";
  const matches = (p: Project) =>
    (filter === "All" || p.categories.includes(filter)) &&
    (domain === "All" || (p.domains?.includes(domain) ?? false));
  const featured = projects.filter((p) => p.featured);
  // When a filter is active, show every match (featured included). Otherwise the
  // featured blooms sit in their own section and the grid holds the rest.
  const grid = projects.filter((p) => matches(p) && (filtering || !p.featured));

  return (
    <>
      {/* Featured (hidden while a filter is active so matches aren't split) */}
      {!filtering && (
        <>
          <h2 className="mt-10 font-body text-2xl font-bold text-ink">
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
            <h3 className="mt-2 font-body text-xl font-bold text-ink">{p.name}</h3>
            <p className="mt-1.5 font-body text-sm text-ink-soft">{p.blurb}</p>
                <DomainChips domains={p.domains} />
                <TechChips categories={p.categories} />
                <Links p={p} />
              </motion.article>
            ))}
          </div>
        </>
      )}

      {/* Filters */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-body text-2xl font-bold text-ink">wander the patches</h2>
        <label className="flex items-center gap-2 font-body text-sm font-semibold text-ink-soft">
          domain
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as Domain | "All")}
            style={domain !== "All" ? { backgroundColor: domainColor[domain] } : undefined}
            className="rounded-full border border-white/70 bg-white/80 px-4 py-1.5 font-body text-sm font-semibold text-ink outline-none transition focus:border-blush focus:ring-2 focus:ring-blush/40"
          >
            <option value="All">All domains</option>
            {domains.map((d) => (
              <option key={d} value={d} style={{ backgroundColor: domainColor[d] }}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

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
          {grid.map((p) => (
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
              <h3 className="mt-1.5 font-body text-base font-bold text-ink">{p.name}</h3>
              <p className="mt-1 font-body text-sm text-ink-soft">{p.blurb}</p>
              <DomainChips domains={p.domains} />
              <TechChips categories={p.categories} />
              <Links p={p} />
            </motion.article>
          ))}
        </AnimatePresence>
        {grid.length === 0 && (
          <p className="font-body text-ink-soft">nothing growing in this patch yet ✦</p>
        )}
      </div>
    </>
  );
}
