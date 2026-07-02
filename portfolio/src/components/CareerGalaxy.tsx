"use client";

// A tiny "trajectory galaxy": career entries embedded + PCA'd like the project
// galaxy, connected in chronological order, so you can watch the path drift
// from software engineering toward ML and LLM research.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CareerPoint {
  icon: string;
  short: string;
  title: string;
  when: string;
  x: number;
  y: number;
}

const W = 100;
const H = 62;
const px = (p: CareerPoint) => 8 + p.x * (W - 16);
const py = (p: CareerPoint) => 8 + p.y * (H - 16);

export default function CareerGalaxy() {
  const [points, setPoints] = useState<CareerPoint[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/career-map")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { points?: CareerPoint[] }) =>
        d.points?.length ? setPoints(d.points) : setFailed(true),
      )
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;

  return (
    <div className="mt-5 rounded-3xl p-5 soft-card sm:p-6">
      {!points ? (
        <p className="font-body text-sm text-ink-soft">charting the journey… 🧭</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="career trajectory map">
            {/* soft grid */}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`v${i}`} x1={(i + 1) * 10} y1={2} x2={(i + 1) * 10} y2={H - 2} stroke="rgba(90,80,120,0.07)" strokeWidth={0.2} />
            ))}
            {Array.from({ length: 5 }).map((_, i) => (
              <line key={`h${i}`} x1={2} y1={(i + 1) * 10.5} x2={W - 2} y2={(i + 1) * 10.5} stroke="rgba(90,80,120,0.07)" strokeWidth={0.2} />
            ))}

            {/* chronological path */}
            <motion.path
              d={points.map((p, i) => `${i === 0 ? "M" : "L"} ${px(p)} ${py(p)}`).join(" ")}
              fill="none"
              stroke="rgba(142,123,214,0.55)"
              strokeWidth={0.5}
              strokeDasharray="1.4 1.1"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
            />

            {points.map((p, i) => (
              <g key={p.title}>
                <motion.circle
                  cx={px(p)}
                  cy={py(p)}
                  r={2.6}
                  fill="rgba(255,255,255,0.85)"
                  stroke="rgba(142,123,214,0.5)"
                  strokeWidth={0.25}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25 * i, type: "spring", stiffness: 200 }}
                />
                <motion.text
                  x={px(p)}
                  y={py(p) + 1.1}
                  textAnchor="middle"
                  fontSize={3.2}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25 * i }}
                >
                  {p.icon}
                </motion.text>
                <motion.text
                  x={px(p)}
                  y={py(p) + 5.4}
                  textAnchor="middle"
                  fontSize={2}
                  fill="#5c5470"
                  fontWeight={600}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.25 * i + 0.1 }}
                >
                  {p.short}
                </motion.text>
                <title>{`${p.title} (${p.when})`}</title>
              </g>
            ))}
          </svg>
          <p className="mt-2 text-center font-body text-xs italic text-ink-soft/80">
            each stop embedded with OpenAI and projected to 2D with PCA, then connected in time.
            watch the drift from software toward LLM research ✦
          </p>
        </>
      )}
    </div>
  );
}
