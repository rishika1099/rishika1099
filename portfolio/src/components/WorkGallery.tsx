"use client";

import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Carousel, cardStep } from "@/components/Carousel";
import ProjectCard, {
  CardActions,
  CardBody,
  ScoreBadge,
  type SearchHit,
  type SearchStatus,
} from "@/components/ProjectCard";
import {
  categoryStyle,
  domainColor,
  domainEmoji,
  type Category,
  type Domain,
  type Project,
} from "@/data/projects";

const TAB_LABEL: Record<string, string> = {
  "High Performance Machine Learning": "High Performance ML",
};

export default function WorkGallery({
  projects,
  categories,
  domains,
  afterFeatured,
}: {
  projects: Project[];
  categories: Category[];
  domains: Domain[];
  /** rendered between the featured blooms and the area shelves */
  afterFeatured?: React.ReactNode;
}) {
  // stable id for each area section, so a pill can jump straight to it
  const areaId = (c: string) => "area-" + c.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  // which category sections have been opened into a grid
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  // which patch's tab is open. "" means "not chosen yet", which resolves to the
  // first patch below, so the page always opens on something.
  const [patch, setPatch] = useState<string>("");
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
  // Where the reader was standing when they asked. The similar view replaces
  // the shelves, so clearing it re-expands the page under a scroll position
  // that no longer means anything, and they land back at the top having lost
  // the patch they were reading.
  const returnTo = useRef(0);

  async function findSimilar(name: string) {
    returnTo.current = window.scrollY;
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

  // Arriving from another page with a project in hand: the recruiter cards have
  // a "find similar" of their own, and nothing there to filter, so they hand the
  // name over in the URL and the search runs here.
  useEffect(() => {
    const name = new URLSearchParams(window.location.search).get("similar");
    if (!name) return;
    findSimilar(name);
    setTimeout(
      () => document.getElementById("similar-results")?.scrollIntoView({ behavior: "smooth", block: "start" }),
      200,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  // "default" is fetched too: it is her own wording expanded to the length the
  // cards are already sized to, so the shorter ones stop leaving a hole. Until
  // it arrives the original blurb shows, which is the same text, just shorter.
  useEffect(() => {
    if (rewrites[level]) return;
    if (level !== "default") setExplaining(true);
    fetch(`/api/explain?level=${level}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { blurbs?: Record<string, string> }) =>
        setRewrites((prev) => ({ ...prev, [level]: d.blurbs ?? {} })),
      )
      .catch(() => setLevel("default"))
      .finally(() => setExplaining(false));
  }, [level, rewrites]);

  const blurbFor = (p: { name: string; blurb: string }) =>
    rewrites[level]?.[p.name] ?? p.blurb;

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
  // Featured projects appear in their areas too, not only in the blooms strip:
  // Sentinel belongs under Internet of Things whether or not it is featured.
  const grid = projects.filter(matches);

  // With 80+ projects a single flat grid buries everything, so group the rest by
  // technical area and show a few from each until you ask for more. While a
  // filter is on the result set is already narrow, so it stays a plain grid.
  // A project sits in every area it belongs to, not just its first one, so
  // Sentinel shows up under Internet of Things as well as Cybersecurity. The
  // counts therefore sum to more than the project total, which is the point.
  const sections = filtering
    ? []
    : categories
        .map((c) => ({ category: c, items: grid.filter((p) => p.categories.includes(c)) }))
        .filter((s) => s.items.length > 0);
  // anything whose primary area isn't in the taxonomy still needs a home
  const placed = new Set(sections.flatMap((s) => s.items.map((p) => p.name)));
  const leftovers = grid.filter((p) => !placed.has(p.name));
  if (leftovers.length) sections.push({ category: "More" as Category, items: leftovers });

  // Which patch is showing. Falls back to the first one so the page always
  // opens on a real panel, including the first render before anything is picked
  // and after a filter changes the set of patches out from under the choice.
  const activePatch =
    sections.find((sec) => sec.category === patch)?.category ?? sections[0]?.category ?? "";


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
                <m.article
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
                  <CardBody p={p} blurb={blurbFor(p)} />
                </m.article>
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
              onClick={() => {
                setSimilarTo(null);
                // after the shelves are back, not before: restoring against the
                // short layout would clamp to its height
                requestAnimationFrame(() =>
                  requestAnimationFrame(() => window.scrollTo({ top: returnTo.current })),
                );
              }}
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
                <m.article
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
                  <CardBody p={p} blurb={blurbFor(p)} />
                  <CardActions name={p.name} onSimilar={() => findSimilar(p.name)} />
                </m.article>
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
          <m.article
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
            <CardBody p={p} blurb={blurbFor(p)} />
                <CardActions name={p.name} onSimilar={() => findSimilar(p.name)} />
              </m.article>
            ))}
          </div>
        </>
      )}

      {afterFeatured}

      {/* Filters */}
      <div id="areas" className="mt-12 scroll-mt-24 flex flex-wrap items-center justify-between gap-3">
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
                {domainEmoji[d] ?? "✦"} {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Everything the patch bar belongs to lives in here. A sticky element
          stops at the bottom of its own container, so bounding it this way is
          what stops the bar drifting on over the embeddings galaxy below. */}
      <div className="relative">
      {/* A domain filter flattens the page into one grid, so the patch menu has
          nothing to jump to. Swap it for the way back out. */}
      {filtering && (
        <div className="sticky top-20 z-30 mt-4 flex justify-center">
          <div className="flex items-center gap-3 rounded-full px-4 py-1.5 font-body text-sm soft-card">
            <span className="text-ink-soft">
              showing{" "}
              <span
                style={{ backgroundColor: domainColor[domain as Domain] ?? "#e6d7f5" }}
                className="rounded-full px-2 py-0.5 font-semibold text-ink"
              >
                {domain}
              </span>{" "}
              · {grid.length} project{grid.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() => setDomain("All")}
              className="rounded-full bg-ink/90 px-3 py-1 font-body text-xs font-semibold text-cream transition hover:opacity-90"
            >
              ✕ clear
            </button>
          </div>
        </div>
      )}

      {/* Tabs, not a stack. Every patch used to render one under the other,
          which ran the page to 8486px: ten screens of scrolling to reach the
          last area. The patches sit side by side now and wrap onto a second
          row rather than scrolling sideways, so none is out of reach.

          Every section still renders; the inactive ones are hidden with the
          `hidden` attribute rather than dropped from the tree. Hiding costs no
          height, keeps every project in the HTML for search engines, and makes
          switching a tab instant instead of a remount. */}
      {!filtering && (
        <div className="sticky top-20 z-30 mt-4">
          {/* The area's own pastel chip, the same one the cards below wear, so
              the bar speaks the site's language rather than a second one.

              Twelve of these took three rows on the first attempt, which was a
              max-w-3xl cap on the tray rather than the chips: given the full
              column they settle into two. */}
          <div
            role="tablist"
            aria-label="project patches"
            className="mx-auto flex flex-wrap items-center justify-center gap-1 rounded-[1.75rem] border border-white/60 bg-white/60 px-2.5 py-2 backdrop-blur-md"
          >
            {sections.map((sec) => {
              const on = sec.category === activePatch;
              const color = categoryStyle[sec.category]?.color ?? "#d8efe2";
              // one name is long enough on its own to push the last chip onto a
              // third row. Shortened on the chip only; the section heading it
              // opens still reads in full.
              const label = TAB_LABEL[sec.category] ?? sec.category;
              return (
                <button
                  key={sec.category}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls={areaId(sec.category)}
                  onClick={() => setPatch(sec.category)}
                  // unpicked chips are washed toward white rather than made
                  // transparent, which would take the label's contrast down
                  // along with the fill
                  style={{
                    backgroundColor: on ? color : `color-mix(in srgb, ${color} 34%, white)`,
                  }}
                  className={`rounded-full px-2 py-1 font-body text-xs transition ${
                    on
                      ? "font-bold text-ink shadow-sm ring-1 ring-ink/10"
                      : "font-semibold text-ink/70 hover:text-ink hover:shadow-sm"
                  }`}
                >
                  {categoryStyle[sec.category]?.emoji ?? "\u2726"} {label}{" "}
                  <span className="font-normal opacity-55">{sec.items.length}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {!filtering &&
        sections.map((sec) => {
          // collapsed = a horizontal shelf of the whole area; open = the grid
          const open = !!openCats[sec.category];
          return (
            <section
              key={sec.category}
              id={areaId(sec.category)}
              role="tabpanel"
              hidden={sec.category !== activePatch}
              className="mt-10 scroll-mt-24"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="flex items-center gap-2 font-body text-xl font-bold text-ink">
                  <span
                    aria-hidden
                    style={{ backgroundColor: categoryStyle[sec.category]?.color ?? "#d8efe2" }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-base"
                  >
                    {categoryStyle[sec.category]?.emoji ?? "✦"}
                  </span>
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
                  <Carousel label="project">
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
            <m.article
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
              <CardBody p={p} blurb={blurbFor(p)} />
              <CardActions name={p.name} onSimilar={() => findSimilar(p.name)} />
            </m.article>
          ))}
        </AnimatePresence>
        {grid.length === 0 && (
          <p className="font-body text-ink-soft">nothing growing in this patch yet ✦</p>
        )}
      </div>
      )}
      </div>
      </>
      )}
    </>
  );
}
