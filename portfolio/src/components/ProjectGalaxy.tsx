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

const CATEGORY_COLOR: Record<string, string> = {
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
const colorFor = (c: string) => CATEGORY_COLOR[c] ?? "#cdeac0";

export default function ProjectGalaxy() {
  const [points, setPoints] = useState<Point[] | null>(null);
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
      .then((d: { points?: Point[] } | null) => {
        if (!d) return;
        setPoints(d.points ?? []);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, []);

  const cats = points ? Array.from(new Set(points.map((p) => p.category))) : [];

  return (
    <section className="mt-14">
      <h2 className="font-body text-2xl font-bold text-ink">the embeddings galaxy ✦</h2>
      <p className="mt-1 max-w-3xl font-body text-sm text-ink-soft">
        every project embedded with OpenAI, then projected to 2D with PCA. Projects that sit
        close together are semantically similar, the clusters are the model&apos;s, not mine.
      </p>

      {status === "off" && (
        <p className="mt-4 font-body text-ink-soft">the galaxy isn&apos;t configured on this deploy yet. ✦</p>
      )}
      {status === "error" && (
        <p className="mt-4 font-body text-ink-soft">the stars wandered off. try again in a moment? ✦</p>
      )}
      {status === "loading" && (
        <p className="mt-4 font-body text-ink-soft">mapping the galaxy… 🌌</p>
      )}

      {status === "done" && points && (
        <>
          <div className="relative mt-5 aspect-[16/10] w-full overflow-hidden rounded-3xl soft-card">
            {points.map((p, i) => {
              const isActive = active === p.name;
              return (
                <motion.a
                  key={p.name}
                  href={p.demo ?? p.repo}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02, type: "spring", stiffness: 200, damping: 18 }}
                  onMouseEnter={() => setActive(p.name)}
                  onMouseLeave={() => setActive((a) => (a === p.name ? null : a))}
                  style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <span
                    className={`block h-4 w-4 rounded-full shadow-sm ring-2 ring-white/70 transition-transform ${
                      isActive ? "scale-150" : "hover:scale-150"
                    }`}
                    style={{ backgroundColor: colorFor(p.category) }}
                  />
                  {isActive && (
                    <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 font-body text-[11px] font-semibold text-cream shadow-lg">
                      {p.emoji} {p.name}
                    </span>
                  )}
                </motion.a>
              );
            })}
          </div>

          {/* legend */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {cats.map((c) => (
              <span key={c} className="flex items-center gap-1.5 font-body text-xs text-ink-soft">
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-white/70"
                  style={{ backgroundColor: colorFor(c) }}
                />
                {c}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
