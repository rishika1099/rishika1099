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
interface GalaxyData {
  points: Point[];
  areas: string[];
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

export default function ProjectGalaxy() {
  const [data, setData] = useState<GalaxyData | null>(null);
  const [status, setStatus] = useState<"loading" | "done" | "off" | "error">("loading");
  const [active, setActive] = useState<string | null>(null);

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

  return (
    <section className="mt-14">
      <h2 className="font-body text-2xl font-bold text-ink">🌌 the embeddings galaxy</h2>

      {status === "off" && (
        <p className="mt-4 font-body text-ink-soft">the galaxy isn&apos;t configured on this deploy yet. ✦</p>
      )}
      {status === "error" && (
        <p className="mt-4 font-body text-ink-soft">the stars wandered off. try again in a moment? ✦</p>
      )}
      {status === "loading" && (
        <p className="mt-4 font-body text-ink-soft">mapping the galaxy… 🌌</p>
      )}

      {status === "done" && data && (
        <>
          <div className="relative mt-5 aspect-[16/10] w-full overflow-hidden rounded-3xl soft-card">
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

            {data.points.map((p, i) => {
              const isActive = active === p.name;
              // flip the popover for dots near the plot edges so it stays inside
              const popBelow = p.y < 0.55;
              const popLeft = p.x > 0.75;
              return (
                <motion.div
                  key={p.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02, type: "spring", stiffness: 200, damping: 18 }}
                  onMouseEnter={() => setActive(p.name)}
                  onMouseLeave={() => setActive((a) => (a === p.name ? null : a))}
                  style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, zIndex: isActive ? 20 : 1 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <button
                    type="button"
                    onClick={() => setActive((a) => (a === p.name ? null : p.name))}
                    onFocus={() => setActive(p.name)}
                    aria-label={`${p.name}, ${p.category}`}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm shadow-sm ring-2 ring-white/80 transition-transform ${
                      isActive ? "scale-[1.6]" : "hover:scale-[1.6]"
                    }`}
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
                            window.dispatchEvent(
                              new CustomEvent("find-similar", { detail: p.name }),
                            )
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
          </div>

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

          <p className="mt-3 font-body text-xs text-ink-soft/80">
            Embedded with OpenAI, projected to 2D with PCA, colored by technical area.
          </p>
        </>
      )}
    </section>
  );
}
