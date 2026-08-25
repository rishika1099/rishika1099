"use client";

import { useState, useEffect, useRef } from "react";
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

function Links({ p }: { p: Pick<Project, "repo" | "demo" | "results" | "article"> }) {
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
      {p.results && (
        <a
          href={p.results}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-mint/80 px-3 py-1 font-body text-xs font-semibold text-ink transition hover:scale-105"
        >
          📊 Results
        </a>
      )}
      {p.article && (
        <a
          href={p.article}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-gold/70 px-3 py-1 font-body text-xs font-semibold text-ink transition hover:scale-105"
        >
          📰 Article
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

/** One project card. Shared by the carousel and the grid so they can't drift. */
function ProjectCard({
  p,
  blurb,
  onSimilar,
  className = "",
}: {
  p: Project;
  blurb: string;
  onSimilar: () => void;
  className?: string;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22 }}
      whileHover={{ y: -5 }}
      className={`flex flex-col rounded-3xl p-5 soft-card ${className}`}
    >
      <span className="text-3xl">{p.emoji}</span>
      <h3 className="mt-1.5 font-body text-base font-bold text-ink">{p.name}</h3>
      <Blurb text={blurb} />
      <DomainChips domains={p.domains} />
      <TechChips categories={p.categories} />
      <Links p={p} />
      <CardActions name={p.name} onSimilar={onSimilar} />
    </motion.article>
  );
}

/**
 * Horizontal shelf for one area. Arrows because a mouse has no sideways scroll,
 * and it advances a card at a time on its own, the way a phone carousel does.
 *
 * The advance yields to the reader: it stops while hovered, focused, or touched,
 * while the shelf is off-screen, for a few seconds after any manual scroll, and
 * entirely when the visitor prefers reduced motion.
 */
function Carousel({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [count, setCount] = useState(0);
  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * cardStep(el), behavior: "smooth" });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let onScreen = false;
    const io = new IntersectionObserver((es) => (onScreen = es[0]?.isIntersecting ?? false), {
      threshold: 0.3,
    });
    io.observe(el);

    // native listeners rather than React's synthetic enter/leave, which are
    // derived from mouseover and easy to miss on a scrolling container
    let held = false;
    const hold = () => (held = true);
    const release = () => (held = false);
    let quietUntil = 0;
    const hush = () => (quietUntil = Date.now() + 6000);
    // scrolling the page with the cursor over a shelf fires wheel here too;
    // only a sideways gesture means the reader is actually driving this shelf
    const maybeHush = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) hush();
    };
    el.addEventListener("pointerenter", hold);
    el.addEventListener("pointerleave", release);
    el.addEventListener("focusin", hold);
    el.addEventListener("focusout", release);
    el.addEventListener("wheel", maybeHush, { passive: true });
    el.addEventListener("pointerdown", hush);
    el.addEventListener("touchstart", hush, { passive: true });

    // keep the dots in step with wherever the shelf actually is, however it got
    // there: an advance, an arrow, a swipe, or a dot
    const sync = () => {
      setCount(el.querySelectorAll("article").length);
      setAt(Math.round(el.scrollLeft / cardStep(el)));
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });

    const id = setInterval(() => {
      if (!onScreen || held || Date.now() < quietUntil) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max < 4) return;
      if (el.scrollLeft >= max - 4) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: cardStep(el), behavior: "smooth" });
    }, 3800);

    return () => {
      clearInterval(id);
      io.disconnect();
      el.removeEventListener("scroll", sync);
      el.removeEventListener("pointerenter", hold);
      el.removeEventListener("pointerleave", release);
      el.removeEventListener("focusin", hold);
      el.removeEventListener("focusout", release);
      el.removeEventListener("wheel", maybeHush);
      el.removeEventListener("pointerdown", hush);
      el.removeEventListener("touchstart", hush);
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="scroll left"
        onClick={() => nudge(-1)}
        className="absolute -left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink-soft shadow-md transition hover:text-ink lg:block"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="scroll right"
        onClick={() => nudge(1)}
        className="absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink-soft shadow-md transition hover:text-ink lg:block"
      >
        ›
      </button>

      {count > 1 && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`go to project ${i + 1} of ${count}`}
              aria-current={i === at ? "true" : undefined}
              onClick={() => {
                const el = ref.current;
                if (el) el.scrollTo({ left: i * cardStep(el), behavior: "smooth" });
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === at ? "w-5 bg-ink/70" : "w-1.5 bg-ink/20 hover:bg-ink/40"
              }`}
            />
          ))}
          <span className="ml-2 font-body text-xs text-ink-soft/70">
            {Math.min(at + 1, count)} / {count}
          </span>
        </div>
      )}
    </div>
  );
}

/** One card plus the flex gap, so a step lands cleanly on the next card. */
function cardStep(el: HTMLElement): number {
  const card = el.querySelector("article");
  return card ? card.getBoundingClientRect().width + 16 : Math.max(300, el.clientWidth * 0.8);
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
  // stable id for each area section, so a pill can jump straight to it
  const areaId = (c: string) => "area-" + c.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  // which category sections have been opened into a grid
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  // the area currently on screen, so one pill reads as "you are here"
  const [activeArea, setActiveArea] = useState<string>("");
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

  const filtering = domain !== "All";
  const matches = (p: Project) => domain === "All" || (p.domains?.includes(domain) ?? false);
  const featured = projects.filter((p) => p.featured);
  // When a filter is active, show every match (featured included). Otherwise the
  // featured blooms sit in their own section and the grid holds the rest.
  const grid = projects.filter((p) => matches(p) && (filtering || !p.featured));

  // With 80+ projects a single flat grid buries everything, so group the rest by
  // technical area and show a few from each until you ask for more. While a
  // filter is on the result set is already narrow, so it stays a plain grid.
  const sections = filtering
    ? []
    : categories
        .map((c) => ({ category: c, items: grid.filter((p) => p.categories[0] === c) }))
        .filter((s) => s.items.length > 0);
  // anything whose primary area isn't in the taxonomy still needs a home
  const placed = new Set(sections.flatMap((s) => s.items.map((p) => p.name)));
  const leftovers = grid.filter((p) => !placed.has(p.name));
  if (leftovers.length) sections.push({ category: "More" as Category, items: leftovers });

  // highlight the pill for whichever area is in view, the way the About page's
  // jump bar does. Marking every area you had opened just accumulated.
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('section[id^="area-"]'));
    if (!nodes.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (first) setActiveArea(first.target.id);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: 0 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
    // rebuilt only when the set of sections changes; without a dependency list
    // every highlight tore the observer down before it could report the next one
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtering, sections.length]);

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

      {/* sticky so you can hop between patches without scrolling back up; one
          scrollable row rather than three wrapped lines eating the viewport */}
      <div className="sticky top-20 z-30 mt-4">
      <div className="mx-auto flex max-w-full gap-2 overflow-x-auto rounded-full p-1.5 soft-card [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(["All", ...categories] as const).map((c) => (
          <button
            key={c}
            // the sections below are already grouped by area, so a pill jumps to
            // one and opens it rather than filtering to a duplicate of it
            onClick={() => {
              if (c === "All") {
                setOpenCats({});
                document.getElementById("areas")?.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
              }
              setOpenCats((o) => ({ ...o, [c]: true }));
              setTimeout(
                () => document.getElementById(areaId(c))?.scrollIntoView({ behavior: "smooth", block: "start" }),
                60,
              );
            }}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 font-body text-sm font-semibold transition ${
              c !== "All" && activeArea === areaId(c)
                ? "bg-ink text-cream"
                : "bg-white/70 text-ink-soft hover:bg-white"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      </div>

      {!filtering &&
        sections.map((sec) => {
          // collapsed = a horizontal shelf of the whole area; open = the grid
          const open = !!openCats[sec.category];
          return (
            <section key={sec.category} id={areaId(sec.category)} className="mt-10 scroll-mt-24">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-body text-xl font-bold text-ink">
                  {sec.category}{" "}
                  <span className="font-normal text-ink-soft">({sec.items.length})</span>
                </h2>
                {!open && sec.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setOpenCats((o) => ({ ...o, [sec.category]: true }))}
                    className="rounded-full bg-white/70 px-3.5 py-1 font-body text-sm font-semibold text-ink-soft transition hover:bg-white hover:text-ink"
                  >
                    show all {sec.items.length} as a grid →
                  </button>
                )}
                {open && (
                  <button
                    type="button"
                    onClick={() => setOpenCats((o) => ({ ...o, [sec.category]: false }))}
                    className="rounded-full bg-white/70 px-3.5 py-1 font-body text-sm font-semibold text-ink-soft transition hover:bg-white hover:text-ink"
                  >
                    back to a shelf
                  </button>
                )}
              </div>
              {open ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sec.items.map((p) => (
                    <ProjectCard
                      key={p.name}
                      p={p}
                      blurb={blurbFor(p)}
                      onSimilar={() => findSimilar(p.name)}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <Carousel>
                    {sec.items.map((p) => (
                      <ProjectCard
                        key={p.name}
                        p={p}
                        blurb={blurbFor(p)}
                        onSimilar={() => findSimilar(p.name)}
                        className="w-[19rem] shrink-0 snap-start"
                      />
                    ))}
                  </Carousel>
                </div>
              )}
            </section>
          );
        })}

      {/* filtered results stay one flat grid: the set is already narrow */}
      {filtering && (
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
      )}
      </>
      )}
    </>
  );
}
