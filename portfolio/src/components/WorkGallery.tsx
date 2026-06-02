"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  domainColor,
  type Category,
  type Domain,
  type Project,
} from "@/data/projects";

function Links({ p }: { p: Pick<Project, "repo" | "demo"> }) {
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

interface SearchHit {
  name: string;
  blurb: string;
  emoji: string;
  repo: string;
  demo?: string;
  categories: Category[];
  domains?: Domain[];
  score: number;
}

type SearchStatus = "idle" | "loading" | "done" | "error" | "off";

// Raw cosine from text-embedding-3-small lives in a narrow band (~0.15 for
// unrelated, ~0.55 for a strong hit). Map that usable band onto 0..100% so the
// badge reads as an intuitive relevance score rather than a deceptively low number.
const REL_LO = 0.18;
const REL_HI = 0.52;
function relevancePct(score: number): number {
  const t = (score - REL_LO) / (REL_HI - REL_LO);
  return Math.round(Math.max(0, Math.min(1, t)) * 100);
}

function ScoreBadge({ score }: { score: number }) {
  const pct = relevancePct(score);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-lavender/70 px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink">
      ✦ {pct}% match
    </span>
  );
}

// "More like this": on demand, fetch the projects most similar to this one
// (by embedding) and reveal them inline. Reuses the cached project vectors.
function RelatedRow({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (hits === null && !loading) {
      setLoading(true);
      try {
        const res = await fetch(`/api/related-projects?name=${encodeURIComponent(name)}`);
        const data = (await res.json()) as { results?: SearchHit[] };
        setHits(data.results ?? []);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        className="font-body text-xs font-semibold text-ink-soft/80 transition hover:text-ink"
      >
        ✦ {open ? "hide similar" : "find similar"}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {loading && (
              <p className="mt-2 font-body text-xs text-ink-soft">finding kindred projects… 🌿</p>
            )}
            {hits && hits.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {hits.map((h) => (
                  <li key={h.name}>
                    <a
                      href={h.demo ?? h.repo}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl bg-white/60 px-2.5 py-1.5 font-body text-xs text-ink-soft transition hover:bg-white"
                    >
                      <span>{h.emoji}</span>
                      <span className="font-semibold text-ink">{h.name}</span>
                      <span className="ml-auto rounded-full bg-lavender/60 px-1.5 py-0.5 text-[10px] font-semibold text-ink">
                        {relevancePct(h.score)}%
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {hits && hits.length === 0 && !loading && (
              <p className="mt-2 font-body text-xs text-ink-soft">no close matches ✦</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [status, setStatus] = useState<SearchStatus>("idle");

  const searching = query.trim().length >= 2;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-projects?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (res.status === 503) {
          setStatus("off");
          setHits([]);
          return;
        }
        if (!res.ok) {
          setStatus("error");
          setHits([]);
          return;
        }
        const data = (await res.json()) as { results: SearchHit[] };
        setHits(data.results ?? []);
        setStatus("done");
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setStatus("error");
          setHits([]);
        }
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

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
      {/* Semantic search: embeds your phrase and ranks projects by meaning */}
      <div className="mt-10">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
            🔍
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search by meaning… 'detect fraud', 'chatbot', 'image generation'"
            aria-label="search projects by meaning"
            className="w-full rounded-full border border-white/70 bg-white/80 py-3 pl-11 pr-4 font-body text-base text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-blush focus:ring-2 focus:ring-blush/40"
          />
        </div>
        <p className="mt-2 font-body text-xs text-ink-soft/80">
          semantic search · your phrase and every project are embedded with OpenAI,
          then ranked by cosine similarity ✦
        </p>
      </div>

      {searching ? (
        <div className="mt-8">
          <h2 className="font-body text-2xl font-bold text-ink">
            best matches for &ldquo;{query.trim()}&rdquo;
          </h2>

          {status === "loading" && (
            <p className="mt-4 font-body text-ink-soft">searching the garden… 🌿</p>
          )}
          {status === "off" && (
            <p className="mt-4 font-body text-ink-soft">
              semantic search isn&apos;t configured on this deploy yet. ✦
            </p>
          )}
          {status === "error" && (
            <p className="mt-4 font-body text-ink-soft">
              something wilted while searching. try again in a moment? ✦
            </p>
          )}
          {status === "done" && hits.length === 0 && (
            <p className="mt-4 font-body text-ink-soft">
              nothing bloomed for that phrase ✦
            </p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {hits.map((p) => (
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
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-3xl">{p.emoji}</span>
                    <ScoreBadge score={p.score} />
                  </div>
                  <h3 className="mt-1.5 font-body text-base font-bold text-ink">{p.name}</h3>
                  <p className="mt-1 font-body text-sm text-ink-soft">{p.blurb}</p>
                  <DomainChips domains={p.domains} />
                  <TechChips categories={p.categories} />
                  <Links p={p} />
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
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
                <RelatedRow name={p.name} />
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
              <RelatedRow name={p.name} />
            </motion.article>
          ))}
        </AnimatePresence>
        {grid.length === 0 && (
          <p className="font-body text-ink-soft">nothing growing in this patch yet ✦</p>
        )}
      </div>
      </>
      )}
    </>
  );
}
