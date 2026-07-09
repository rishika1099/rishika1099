"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface Point {
  name: string;
  emoji: string;
  category: string;
  domains: string[];
  repo: string;
  demo?: string;
  x: number;
  y: number;
}
interface You {
  x: number;
  y: number;
  query: string;
  nearest: string;
  nearestEmoji: string;
  score: number;
}
interface GalaxyData {
  points: Point[];
  areas: string[];
  you?: You;
}

// soft pastel color per technical area (matches the Work filter areas)
const AREA_COLOR: Record<string, string> = {
  "Generative AI": "#c9b6f0",
  "Agentic AI": "#a9c5f2",
  NLP: "#f0c2e0",
  "Causal Inference": "#9fe0cd",
  "Statistical Modeling": "#f3d79a",
  "Machine Learning": "#cdeac0",
  "Predictive Analysis": "#f4c1ac",
  "Deep Learning": "#bcccf5",
  "Computer Vision": "#f6c2d2",
  "High Performance Machine Learning": "#ffd49a",
  Cybersecurity: "#d2d6de",
  "Internet of Things": "#bfe0e8",
};
const colorFor = (area: string) => AREA_COLOR[area] ?? "#cdeac0";

// fallbacks, used when the editable copy hasn't been threaded in (e.g. the
// edit-mode preview); the live Work page passes the real copy map.
const DEFAULTS = {
  "work.galaxy.title": "🌌 the embeddings galaxy",
  "work.galaxy.intro":
    "every project embedded and projected to 2D, so similar work sits close together. drop in something you care about and see where <em>you</em> land.",
  "work.galaxy.placeholder": "e.g. real-time ML on tiny devices",
  "work.galaxy.cta": "drop me in",
  "work.galaxy.examples":
    "making LLMs run faster, computer vision on medical images, fairness in high-stakes decisions, causal inference, something with agents",
  "work.galaxy.hint":
    "Embedded with OpenAI, projected to 2D with PCA, colored by technical area. Your star is the same query embedding projected into the very same axes.",
} as const;

export default function ProjectGalaxy({ copy }: { copy?: Record<string, string> }) {
  const t = (k: keyof typeof DEFAULTS) => copy?.[k]?.trim() || DEFAULTS[k];
  const examples = t("work.galaxy.examples").split(",").map((s) => s.trim()).filter(Boolean);
  const [data, setData] = useState<GalaxyData | null>(null);
  const [status, setStatus] = useState<"loading" | "done" | "off" | "error">("loading");
  const [active, setActive] = useState<string | null>(null);

  // matchmaking: drop a typed interest into the map as a "you are here" star
  const [q, setQ] = useState("");
  const [you, setYou] = useState<You | null>(null);
  const [qBusy, setQBusy] = useState(false);
  const [qErr, setQErr] = useState("");

  useEffect(() => {
    fetch("/api/project-map")
      .then((r) => {
        if (r.status === 503) {
          setStatus("off");
          return null;
        }
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: GalaxyData | null) => {
        if (!d) return;
        setData(d);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, []);

  async function drop(query: string) {
    const s = query.trim();
    if (s.length < 2) return;
    setQBusy(true);
    setQErr("");
    try {
      const r = await fetch(`/api/project-map?q=${encodeURIComponent(s)}`);
      if (!r.ok) throw new Error(String(r.status));
      const d = (await r.json()) as GalaxyData;
      if (d.you) {
        setYou(d.you);
        setActive(d.you.nearest); // pop the closest project open
      } else {
        setYou(null);
        setQErr("nothing landed close enough, try another phrasing ✦");
      }
    } catch {
      setQErr("the stars wandered off, try again in a moment?");
    } finally {
      setQBusy(false);
    }
  }

  function clearYou() {
    setYou(null);
    setQ("");
    setQErr("");
    setActive(null);
  }

  const nearPoint = you && data ? data.points.find((p) => p.name === you.nearest) : undefined;

  return (
    <section className="mt-14">
      <h2 className="font-body text-2xl font-bold text-ink">{t("work.galaxy.title")}</h2>
      <p
        className="mt-1 max-w-2xl font-body text-sm text-ink-soft"
        dangerouslySetInnerHTML={{ __html: t("work.galaxy.intro") }}
      />

      {status === "off" && (
        <p className="mt-4 font-body text-ink-soft">the galaxy isn&apos;t configured on this deploy yet. ✦</p>
      )}
      {status === "error" && (
        <p className="mt-4 font-body text-ink-soft">the stars wandered off. try again in a moment? ✦</p>
      )}
      {status === "loading" && <p className="mt-4 font-body text-ink-soft">mapping the galaxy… 🌌</p>}

      {status === "done" && data && (
        <>
          {/* matchmaking input: drop an interest into the same embedding space */}
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              drop(q);
            }}
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("work.galaxy.placeholder")}
              className="w-full rounded-full border border-white/70 bg-white/80 px-5 py-2.5 font-body text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-2 focus:ring-blush/30"
            />
            <button
              type="submit"
              disabled={qBusy}
              className="shrink-0 rounded-full bg-ink px-5 py-2.5 font-body text-sm font-semibold text-cream transition hover:opacity-90 disabled:opacity-50"
            >
              {qBusy ? "…" : t("work.galaxy.cta")}
            </button>
            {you && (
              <button
                type="button"
                onClick={clearYou}
                className="shrink-0 rounded-full bg-white/70 px-4 py-2.5 font-body text-sm font-semibold text-ink-soft transition hover:text-ink"
              >
                clear
              </button>
            )}
          </form>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setQ(ex);
                  drop(ex);
                }}
                className="rounded-full bg-white/60 px-3 py-1 font-body text-xs font-semibold text-ink-soft transition hover:bg-white"
              >
                {ex}
              </button>
            ))}
          </div>
          {qErr && <p className="mt-3 font-body text-sm text-rose-500">{qErr}</p>}

          <div className="relative mt-4 aspect-[16/10] w-full overflow-hidden rounded-3xl soft-card">
            {/* subtle xy grid so it reads like a coordinate space */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(74,74,94,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,74,94,0.06) 1px, transparent 1px)",
                backgroundSize: "38px 38px",
              }}
            />

            {/* axis tick numbers + labels */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-4 bottom-1 flex justify-between font-body text-[9px] text-ink/30"
            >
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <span key={`x${t}`}>{t.toFixed(2)}</span>
              ))}
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-4 left-1.5 flex flex-col justify-between font-body text-[9px] text-ink/30"
            >
              {[1, 0.75, 0.5, 0.25, 0].map((t) => (
                <span key={`y${t}`}>{t.toFixed(2)}</span>
              ))}
            </div>
            <span aria-hidden className="pointer-events-none absolute bottom-1 right-3 font-body text-[9px] font-semibold text-ink/40">
              PC 1 →
            </span>
            <span aria-hidden className="pointer-events-none absolute left-2 top-1.5 font-body text-[9px] font-semibold text-ink/40">
              ↑ PC 2
            </span>

            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-ink/10" />
            <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-ink/10" />

            {/* dashed line from the "you are here" star to its nearest project */}
            {you && nearPoint && (
              <svg
                aria-hidden
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line
                  x1={you.x * 100}
                  y1={you.y * 100}
                  x2={nearPoint.x * 100}
                  y2={nearPoint.y * 100}
                  stroke="#c77dba"
                  strokeWidth={1.2}
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.55}
                />
              </svg>
            )}

            {data.points.map((p, i) => {
              const isActive = active === p.name;
              const isNear = you?.nearest === p.name;
              // flip the popover for dots near the plot edges so it stays inside
              const popBelow = p.y < 0.55;
              const popLeft = p.x > 0.75;
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: you && !isNear ? 0.4 : 1, scale: 1 }}
                  transition={{ delay: i * 0.02, type: "spring", stiffness: 200, damping: 18 }}
                  onMouseEnter={() => setActive(p.name)}
                  onMouseLeave={() => setActive((a) => (a === p.name ? null : a))}
                  style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, zIndex: isActive ? 20 : isNear ? 10 : 1 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <button
                    type="button"
                    onClick={() => setActive((a) => (a === p.name ? null : p.name))}
                    onFocus={() => setActive(p.name)}
                    aria-label={`${p.name}, ${p.category}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm shadow-sm transition-transform ${
                      isNear ? "ring-4 ring-blush" : "ring-2 ring-white/80"
                    } ${isActive || isNear ? "scale-[1.6]" : "hover:scale-[1.6]"}`}
                    style={{ backgroundColor: colorFor(p.category) }}
                  >
                    {p.emoji}
                  </button>
                  {isActive && (
                    <div
                      className={`absolute z-30 w-52 rounded-2xl border border-white/70 bg-white/95 p-3 shadow-xl backdrop-blur ${
                        popBelow ? "top-full mt-2" : "bottom-full mb-2"
                      } ${popLeft ? "right-0" : "left-1/2 -translate-x-1/2"}`}
                    >
                      <p className="font-body text-sm font-bold leading-snug text-ink">
                        {p.emoji} {p.name}
                      </p>
                      <p className="mt-0.5 font-body text-[11px] font-semibold text-ink-soft">
                        {p.category}
                        {p.domains.length > 0 && ` · ${p.domains.join(", ")}`}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        <a
                          href={p.repo}
                          target="_blank"
                          rel="noreferrer"
                          className="font-body text-xs font-semibold text-ink-soft transition hover:text-ink"
                        >
                          ⭑ code
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            window.dispatchEvent(new CustomEvent("find-similar", { detail: p.name }))
                          }
                          className="font-body text-xs font-semibold text-ink-soft transition hover:text-ink"
                        >
                          ✦ find similar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            window.dispatchEvent(
                              new CustomEvent("ask-question", {
                                detail: `Walk me through the "${p.name}" project: what it does, how it's built, and what makes it interesting.`,
                              }),
                            )
                          }
                          className="font-body text-xs font-semibold text-ink-soft transition hover:text-ink"
                        >
                          💬 ask
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* the "you are here" star */}
            {you && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 16 }}
                style={{ left: `${you.x * 100}%`, top: `${you.y * 100}%`, zIndex: 25 }}
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              >
                <span className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-blush/50" />
                <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm shadow-md ring-2 ring-blush">
                  ✦
                </span>
                <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 font-body text-[10px] font-semibold text-cream">
                  you
                </span>
              </motion.div>
            )}
          </div>

          {/* nearest-match callout */}
          {you && (
            <p className="mt-3 font-body text-sm text-ink">
              <span className="text-ink-soft">&ldquo;{you.query}&rdquo; lands closest to</span>{" "}
              <span className="font-bold">
                {you.nearestEmoji} {you.nearest}
              </span>{" "}
              <span className="text-ink-soft">({Math.round(you.score * 100)}% by meaning)</span>
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("ask-question", { detail: `Tell me about ${you.nearest}.` }),
                  )
                }
                className="ml-2 rounded-full bg-lavender/50 px-3 py-0.5 font-body text-[11px] font-semibold text-ink transition hover:bg-lavender/70"
              >
                ask about it →
              </button>
            </p>
          )}

          {/* area legend */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {data.areas.map((a) => (
              <span key={a} className="flex items-center gap-1.5 font-body text-xs text-ink-soft">
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-white/70"
                  style={{ backgroundColor: colorFor(a) }}
                />
                {a}
              </span>
            ))}
          </div>

          <p className="mt-3 font-body text-xs text-ink-soft/80">{t("work.galaxy.hint")}</p>
        </>
      )}
    </section>
  );
}
