"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { categoryStyle, type Category } from "@/data/projects";

type Cluster = {
  label: string;
  /** the canonical Category name, when this hub is one of the site's tags */
  tag?: Category;
  emoji: string;
  color: string;
  x: number; // % of the canvas
  y: number;
  skills: string[];
};

// Hubs that are project tags take their colour and face from the same table the
// chips on a project card use, so a "Computer Vision" pill and the Computer
// Vision hub are the same colour everywhere on the site. The last two are real
// skills that are not project categories, so they carry their own tint.
const hub = (tag: Category, label: string, x: number, y: number, skills: string[]): Cluster => ({
  label,
  tag,
  emoji: categoryStyle[tag].emoji,
  color: categoryStyle[tag].color,
  x,
  y,
  skills,
});

const clusters: Cluster[] = [
  hub("Generative AI", "Generative AI", 14, 10, ["RAG", "Embeddings", "Fine-tuning", "Prompting", "LangChain"]),
  hub("Agentic AI", "Agentic AI", 38, 10, ["Multi-Agent", "Tool Use", "Planning", "Orchestration"]),
  hub("NLP", "NLP", 62, 10, ["Text Classification", "Transformers", "Embeddings", "TF-IDF"]),
  hub("Causal Inference", "Causal Inference", 86, 10, ["ATE / CATE", "Mediation", "Counterfactuals", "DoWhy"]),

  hub("High Performance Machine Learning", "High Performance ML", 12, 35, ["Quantization", "Sparsity", "GPU Inference", "Triton"]),
  hub("Deep Learning", "Deep Learning", 36, 35, ["Neural Networks", "Transfer Learning", "PyTorch", "TensorFlow"]),
  hub("Machine Learning", "Machine Learning", 62, 35, ["Regression", "Classification", "Unsupervised Learning", "scikit-learn", "XGBoost", "SHAP"]),
  hub("Statistical Modeling", "Statistical Modeling", 88, 35, ["Hypothesis Testing", "A/B Testing", "Bayesian", "R"]),

  hub("Computer Vision", "Computer Vision", 14, 61, ["Image Classification", "Object Detection", "OpenCV", "YOLO"]),
  hub("Predictive Analysis", "Predictive Analysis", 40, 61, ["Forecasting", "Time Series", "Risk Scoring", "Feature Engineering"]),
  hub("Internet of Things", "Internet of Things", 64, 61, ["Sensors", "Edge Devices", "Wokwi", "Real-time Alerts"]),
  hub("Cybersecurity", "Cybersecurity", 88, 61, ["Anomaly Detection", "Malware Analysis", "Cryptography"]),

  { label: "Web Development", emoji: "🌐", color: "#bfe0e3", x: 36, y: 87, skills: ["React", "Next.js", "TypeScript", "Tailwind", "FastAPI"] },
  { label: "Data & Cloud", emoji: "☁️", color: "#f8d4bd", x: 62, y: 87, skills: ["Python", "SQL", "Spark", "Databricks", "Docker", "AWS"] },
];

// hubs wired to each other, like a network
// 0 GenAI 1 Agentic 2 NLP 3 Causal | 4 HPML 5 DL 6 ML 7 Stats
// 8 CV 9 Predictive 10 IoT 11 Cyber | 12 WebDev 13 Data&Cloud
const clusterLinks: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [6, 7], [2, 5],
  [5, 8], [6, 3], [6, 9], [9, 7], [8, 10], [10, 11], [11, 13],
  [6, 13], [13, 8], [0, 13], [3, 7], [12, 13], [0, 12], [12, 8],
  [1, 6], [9, 13],
];

// Hand-tuned angles could not keep 61 labels off each other and off the hubs,
// so the ring is only a starting point: a short relaxation pass afterwards
// pushes overlapping labels apart. It runs once at module load and is fully
// deterministic, so the layout is the same on the server and in the browser.
const ringX = (n: number) => 9.5 + n * 0.5;
const ringY = (n: number) => 8 + n * 0.35;
const START = [-2, -1.35, -1.5, -1.1, 0.4, 0.55, 0.6, 0.8, 1.15, -0.75, 1.35, 1.8, 1.15, 1.6];

// canvas is 1000x940, and labels are measured in percent of it
const W = 1000;
const H = 940;
const nodeW = (t: string) => ((t.length * 6.2 + 26) / W) * 100;
const hubW = (t: string) => ((t.length * 7.6 + 46) / W) * 100;
const NODE_H = (24 / H) * 100;
const HUB_H = (34 / H) * 100;

type Node = { skill: string; x: number; y: number; ci: number };

const nodes: Node[] = clusters.flatMap((c, ci) =>
  c.skills.map((skill, k) => {
    const n = c.skills.length;
    const angle = ((k + 0.5) / n) * Math.PI * 2 + START[ci];
    return { skill, x: c.x + ringX(n) * Math.cos(angle), y: c.y + ringY(n) * Math.sin(angle), ci };
  }),
);

(() => {
  const box = (x: number, y: number, w: number, h: number) => ({
    l: x - w / 2, r: x + w / 2, t: y - h / 2, b: y + h / 2,
  });
  const hubBoxes = clusters.map((c) =>
    box(c.x, c.y, hubW(`${c.emoji} ${c.label}`), HUB_H),
  );
  // keep every label whole: the old layout let "Object Detection" and
  // "Inference" run off the left edge, where they were clipped mid-word
  const fit = (i: number) => {
    const hw = nodeW(nodes[i].skill) / 2 + 0.4;
    const hh = NODE_H / 2 + 0.4;
    nodes[i].x = Math.min(100 - hw, Math.max(hw, nodes[i].x));
    nodes[i].y = Math.min(100 - hh, Math.max(hh, nodes[i].y));
  };
  const push = (i: number, dx: number, dy: number) => {
    nodes[i].x += dx;
    nodes[i].y += dy;
    fit(i);
  };
  nodes.forEach((_, i) => fit(i));
  for (let pass = 0; pass < 60; pass++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      const a = box(nodes[i].x, nodes[i].y, nodeW(nodes[i].skill), NODE_H);
      // off the hubs first: a label sitting on a hub pill is the ugliest case
      for (const h of hubBoxes) {
        const ox = Math.min(a.r, h.r) - Math.max(a.l, h.l);
        const oy = Math.min(a.b, h.b) - Math.max(a.t, h.t);
        if (ox > 0 && oy > 0) {
          moved = true;
          if (oy < ox) push(i, 0, nodes[i].y < (h.t + h.b) / 2 ? -(oy + 0.4) : oy + 0.4);
          else push(i, nodes[i].x < (h.l + h.r) / 2 ? -(ox + 0.4) : ox + 0.4, 0);
        }
      }
      // then off each other
      for (let j = i + 1; j < nodes.length; j++) {
        const bx = box(nodes[j].x, nodes[j].y, nodeW(nodes[j].skill), NODE_H);
        const ox = Math.min(a.r, bx.r) - Math.max(a.l, bx.l);
        const oy = Math.min(a.b, bx.b) - Math.max(a.t, bx.t);
        if (ox > 0 && oy > 0) {
          moved = true;
          const s = (oy + 0.3) / 2;
          const up = nodes[i].y < nodes[j].y ? -1 : 1;
          push(i, 0, up * s);
          push(j, 0, -up * s);
        }
      }
    }
    if (!moved) break;
  }
})();

const clamp = (v: number) => Math.min(1.8, Math.max(0.3, v));

export default function SkillGraph() {
  const [scale, setScale] = useState(0.8);
  const [resetKey, setResetKey] = useState(0);
  const [full, setFull] = useState(false);
  const [hint, setHint] = useState(false);

  // fit the whole 1000x940 canvas to the viewport (handles small phones)
  function enterFull() {
    if (typeof window !== "undefined") {
      const fit = Math.min(window.innerWidth / 1000, window.innerHeight / 940) * 0.92;
      setScale(Math.max(0.3, Math.min(1, fit)));
    }
    setResetKey((k) => k + 1); // recenter the pan
    setFull(true);
  }
  function exitFull() {
    setFull(false);
    setScale(0.8);
    setResetKey((k) => k + 1);
  }

  // Esc exits fullscreen; lock body scroll while fullscreen
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && exitFull();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [full]);

  return (
    <div
      className={
        full
          ? "fixed inset-0 z-[80] overflow-hidden bg-cream"
          : "relative mt-5 h-[520px] w-full overflow-hidden rounded-3xl border border-white/50 bg-white/25"
      }
    >
      <div className="flex h-full w-full items-center justify-center">
        <m.div
          key={resetKey}
          drag
          dragMomentum={false}
          onHoverStart={() => setHint(true)}
          onHoverEnd={() => setHint(false)}
          onDragStart={() => setHint(false)}
          style={{ scale }}
          className="relative h-[940px] w-[1000px] shrink-0 cursor-grab active:cursor-grabbing"
        >
          {/* edges */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {clusterLinks.map(([a, b], i) => (
              <line
                key={`c${i}`}
                x1={clusters[a].x}
                y1={clusters[a].y}
                x2={clusters[b].x}
                y2={clusters[b].y}
                stroke="#b9a8d6"
                strokeWidth={0.3}
                strokeOpacity={0.5}
              />
            ))}
            {nodes.map((n, i) => (
              <line
                key={`n${i}`}
                x1={clusters[n.ci].x}
                y1={clusters[n.ci].y}
                x2={n.x}
                y2={n.y}
                stroke={clusters[n.ci].color}
                strokeWidth={0.4}
                strokeOpacity={0.85}
              />
            ))}
          </svg>

          {/* area hubs */}
          {clusters.map((c) => (
            <div
              key={c.label}
              style={{ left: `${c.x}%`, top: `${c.y}%`, backgroundColor: c.color }}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-3.5 py-1.5 font-body text-sm font-bold text-ink shadow-md"
            >
              {c.emoji} {c.label}
            </div>
          ))}

          {/* tool / method nodes */}
          {nodes.map((n, i) => (
            <m.span
              key={`${n.skill}-${i}`}
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 4 + (i % 5) * 0.6, ease: "easeInOut" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/70 bg-white/90 px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink-soft shadow-sm"
            >
              {n.skill}
            </m.span>
          ))}
        </m.div>
      </div>

      {/* hover hint */}
      <AnimatePresence>
        {hint && (
          <m.span
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2 rounded-full bg-ink px-3 py-1 font-body text-xs font-semibold text-cream shadow-lg"
          >
            ✦ drag me
          </m.span>
        )}
      </AnimatePresence>

      {/* zoom controls */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
        <button
          onClick={() => setScale((s) => clamp(s - 0.2))}
          aria-label="zoom out"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/85 font-body text-lg font-bold text-ink shadow-sm transition hover:bg-white"
        >
          −
        </button>
        <button
          onClick={() => setScale((s) => clamp(s + 0.2))}
          aria-label="zoom in"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/85 font-body text-lg font-bold text-ink shadow-sm transition hover:bg-white"
        >
          +
        </button>
        <button
          onClick={() => {
            setScale(0.8);
            setResetKey((k) => k + 1);
          }}
          aria-label="reset"
          className="flex h-8 items-center justify-center rounded-full bg-white/85 px-3 font-body text-xs font-semibold text-ink-soft shadow-sm transition hover:bg-white"
        >
          reset
        </button>
        <button
          onClick={() => (full ? exitFull() : enterFull())}
          aria-label={full ? "exit fullscreen" : "fullscreen"}
          className="flex h-8 items-center justify-center rounded-full bg-white/85 px-3 font-body text-xs font-semibold text-ink-soft shadow-sm transition hover:bg-white"
        >
          {full ? "✕ close" : "⛶ fullscreen"}
        </button>
      </div>

      {/* easy-to-reach close button while fullscreen (esp. on mobile) */}
      {full && (
        <button
          onClick={exitFull}
          aria-label="exit fullscreen"
          className="absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl text-ink shadow-md transition hover:bg-white"
        >
          ✕
        </button>
      )}

      <span className="pointer-events-none absolute bottom-3 left-4 font-body text-xs text-ink-soft/80">
        drag to explore · + / − to zoom
      </span>
    </div>
  );
}
