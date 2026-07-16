"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  domainColor,
  type Category,
  type Domain,
  type Project,
} from "@/data/projects";

// blurbs written in the ink editor are HTML; older ones are plain text
const isHtml = (s: string) => /<[a-z][\s\S]*>/i.test(s);
function Blurb({ text }: { text: string }) {
  return isHtml(text) ? (
    <span
      className="rich-passage mt-1 block font-body text-sm text-ink-soft"
      dangerouslySetInnerHTML={{ __html: text }}
    />
  ) : (
    <p className="mt-1 font-body text-sm text-ink-soft">{text}</p>
  );
}

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
          style={{ backgroundColor: domainColor[d] ?? "#e6d7f5" }}
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

// Card footer actions: "find similar" narrows the grid by embedding
// similarity; "ask about this" opens the chatbot pre-loaded with the project.
function CardActions({ name, onSimilar }: { name: string; onSimilar: () => void }) {
  return (
    <div className="mt-auto flex flex-wrap gap-3 pt-3">
      <button
        type="button"
        onClick={onSimilar}
        className="text-left font-body text-xs font-semibold text-ink-soft/80 transition hover:text-ink"
      >
        ✦ find similar
      </button>
      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("ask-question", {
              detail: `Walk me through the "${name}" project: what it does, how it's built, and what makes it interesting.`,
            }),
          )
        }
        className="text-left font-body text-xs font-semibold text-ink-soft/80 transition hover:text-ink"
      >
        💬 ask about this
      </button>
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
  const [level, setLevel] = useState<"default" | "eli5" | "expert">("default");
  const [rewrites, setRewrites] = useState<Record<string, Record<string, string>>>({});
  const [explaining, setExplaining] = useState(false);
  const [similarTo, setSimilarTo] = useState<string | null>(null);
  const [similarHits, setSimilarHits] = useState<SearchHit[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  const searching = query.trim().length >= 2;

  // Narrow the grid to the projects most similar to `name`, like a filter.
  async function findSimilar(name: string) {
    setQuery("");
    setSimilarTo(name);
    setSimilarLoading(true);
    setSimilarHits([]);
    try {
      const res = await fetch(`/api/related-projects?name=${encodeURIComponent(name)}`);
      const data = (await res.json()) as { results?: SearchHit[] };
      setSimilarHits(data.results ?? []);
    } catch {
      setSimilarHits([]);
    } finally {
      setSimilarLoading(false);
    }
  }

  // The galaxy's popover can also trigger "find similar" from below the grid.
  useEffect(() => {
    const onFind = (e: Event) => {
      const name = (e as CustomEvent<string>).detail;
      if (!name) return;
      findSimilar(name);
      setTimeout(
        () => document.getElementById("similar-results")?.scrollIntoView({ behavior: "smooth", block: "start" }),
        150,
      );
    };
    window.addEventListener("find-similar", onFind);
    return () => window.removeEventListener("find-similar", onFind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch the rewritten blurbs once per level (cached after first fetch).
  useEffect(() => {
    if (level === "default" || rewrites[level]) return;
    setExplaining(true);
    fetch(`/api/explain?level=${level}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { blurbs?: Record<string, string> }) =>
        setRewrites((prev) => ({ ...prev, [level]: d.blurbs ?? {} })),
      )
      .catch(() => setLevel("default"))
      .finally(() => setExplaining(false));
  }, [level, rewrites]);

  const blurbFor = (p: { name: string; blurb: string }) =>
    level === "default" ? p.blurb : rewrites[level]?.[p.name] ?? p.blurb;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    setSimilarTo(null);
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
                  className="flex flex-col rounded-3xl p-5 soft-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-3xl">{p.emoji}</span>
                    <ScoreBadge score={p.score} />
                  </div>
                  <h3 className="mt-1.5 font-body text-base font-bold text-ink">{p.name}</h3>
                  <Blurb text={p.blurb} />
                  <DomainChips domains={p.domains} />
                  <TechChips categories={p.categories} />
                  <Links p={p} />
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : similarTo ? (
        <div id="similar-results" className="mt-8 scroll-mt-24">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-body text-2xl font-bold text-ink">
              ✦ similar to &ldquo;{similarTo}&rdquo;
            </h2>
            <button
              type="button"
              onClick={() => setSimilarTo(null)}
              className="rounded-full bg-white/70 px-4 py-1.5 font-body text-sm font-semibold text-ink-soft transition hover:bg-white"
            >
              ← show all
            </button>
          </div>
          {similarLoading && (
            <p className="mt-4 font-body text-ink-soft">finding kindred projects… 🌿</p>
          )}
          {!similarLoading && similarHits.length === 0 && (
            <p className="mt-4 font-body text-ink-soft">no close matches for this one ✦</p>
          )}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {similarHits.map((p) => (
                <motion.article
                  layout
                  key={p.name}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.25 }}
                  whileHover={{ y: -5 }}
                  className="flex flex-col rounded-3xl p-5 soft-card"
                >
                  <span className="text-3xl">{p.emoji}</span>
                  <h3 className="mt-1.5 font-body text-base font-bold text-ink">{p.name}</h3>
                  <Blurb text={blurbFor(p)} />
                  <DomainChips domains={p.domains} />
                  <TechChips categories={p.categories} />
                  <Links p={p} />
                  <CardActions name={p.name} onSimilar={() => findSimilar(p.name)} />
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ) : (
      <>
      {/* Explain-level toggle: rewrites every blurb for the chosen audience */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <span className="font-body text-sm font-semibold text-ink-soft">explain like:</span>
        {(
          [
            ["default", "🌷 default"],
            ["eli5", "🧸 i'm 5"],
            ["expert", "🎓 expert"],
          ] as const
        ).map(([lv, label]) => (
          <button
            key={lv}
            type="button"
            onClick={() => setLevel(lv)}
            className={`rounded-full px-4 py-1.5 font-body text-sm font-semibold transition ${
              level === lv ? "bg-ink text-cream" : "bg-white/70 text-ink-soft hover:bg-white"
            }`}
          >
            {label}
          </button>
        ))}
        {explaining && <span className="font-body text-xs text-ink-soft">rewriting… ✨</span>}
      </div>

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
            className="flex flex-col rounded-3xl p-6 soft-card"
          >
            <span className="animate-float-med text-4xl">{p.emoji}</span>
            <h3 className="mt-2 font-body text-xl font-bold text-ink">{p.name}</h3>
            <Blurb text={blurbFor(p)} />
                <DomainChips domains={p.domains} />
                <TechChips categories={p.categories} />
                <Links p={p} />
                <CardActions name={p.name} onSimilar={() => findSimilar(p.name)} />
              </motion.article>
            ))}
          </div>
        </>
      )}

      {/* Filters */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-body text-2xl font-bold text-ink">🐝 wander the patches</h2>
        <label className="flex items-center gap-2 font-body text-sm font-semibold text-ink-soft">
          domain
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as Domain | "All")}
            style={domain !== "All" ? { backgroundColor: domainColor[domain] ?? "#e6d7f5" } : undefined}
            className="rounded-full border border-white/70 bg-white/80 px-4 py-1.5 font-body text-sm font-semibold text-ink outline-none transition focus:border-blush focus:ring-2 focus:ring-blush/40"
          >
            <option value="All">All domains</option>
            {domains.map((d) => (
              <option key={d} value={d} style={{ backgroundColor: domainColor[d] ?? "#e6d7f5" }}>
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
              className="flex flex-col rounded-3xl p-5 soft-card"
            >
              <span className="text-3xl">{p.emoji}</span>
              <h3 className="mt-1.5 font-body text-base font-bold text-ink">{p.name}</h3>
              <Blurb text={blurbFor(p)} />
              <DomainChips domains={p.domains} />
              <TechChips categories={p.categories} />
              <Links p={p} />
              <CardActions name={p.name} onSimilar={() => findSimilar(p.name)} />
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
