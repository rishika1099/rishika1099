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
  cluster: number;
}
interface ClusterMeta {
  id: number;
  label: string;
  description: string;
  size: number;
}
interface GalaxyData {
  points: Point[];
  clusters: ClusterMeta[];
  k: number;
  silhouette: number;
  bestK: number;
  bestSilhouette: number;
}

// soft pastel palette, indexed by cluster id
const CLUSTER_COLORS = [
  "#c9b6f0",
  "#9fe0cd",
  "#f6c2d2",
  "#ffd49a",
  "#a9c5f2",
  "#cdeac0",
];
const colorFor = (c: number) => CLUSTER_COLORS[c % CLUSTER_COLORS.length];

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
      <p className="mt-1 max-w-3xl font-body text-sm text-ink-soft">
        every project embedded with OpenAI, projected to 2D with PCA, then grouped with
        k-means. Projects that sit close together are semantically similar, and the clusters
        are the model&apos;s, not mine.
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

      {status === "done" && data && (
        <>
          <div className="relative mt-5 aspect-[16/10] w-full overflow-hidden rounded-3xl soft-card">
            {data.points.map((p, i) => {
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
                  style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, zIndex: isActive ? 20 : 1 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm shadow-sm ring-2 ring-white/80 transition-transform ${
                      isActive ? "scale-[1.6]" : "hover:scale-[1.6]"
                    }`}
                    style={{ backgroundColor: colorFor(p.cluster) }}
                  >
                    {p.emoji}
                  </span>
                  {isActive && (
                    <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 font-body text-[11px] font-semibold text-cream shadow-lg">
                      {p.emoji} {p.name}
                    </span>
                  )}
                </motion.a>
              );
            })}
          </div>

          {/* cluster explanations */}
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {data.clusters.map((c) => (
              <li key={c.id} className="flex gap-2 rounded-2xl bg-white/50 p-3">
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-full ring-1 ring-white/70"
                  style={{ backgroundColor: colorFor(c.id) }}
                />
                <span className="font-body text-xs text-ink-soft">
                  <span className="font-bold text-ink">{c.label}</span>{" "}
                  <span className="text-ink-soft/70">· {c.size}</span>
                  {c.description && <span className="block">{c.description}</span>}
                </span>
              </li>
            ))}
          </ul>

          {/* note: this is a k-means grouping, not a claim of tight separation */}
          <p className="mt-3 max-w-3xl font-body text-xs text-ink-soft/80">
            Grouped into {data.k} themes with k-means over the project embeddings. Each project
            is placed near the others it&apos;s most semantically similar to, and every cluster&apos;s
            label and description are generated from its member projects. ✦
          </p>
        </>
      )}
    </section>
  );
}
