"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Cluster = {
  label: string;
  emoji: string;
  color: string;
  x: number; // % of the canvas
  y: number;
  skills: string[];
};

// Hubs are the areas I work in; the nodes orbiting each are the tools / methods.
const clusters: Cluster[] = [
  { label: "Generative AI", emoji: "✨", color: "#e0cdf2", x: 15, y: 16, skills: ["RAG", "Embeddings", "Fine-tuning", "Prompting", "LangChain"] },
  { label: "Agentic AI", emoji: "🤖", color: "#f0c8e8", x: 40, y: 11, skills: ["Multi-Agent", "Tool Use", "Planning", "Orchestration"] },
  { label: "NLP", emoji: "💬", color: "#cdd7f2", x: 64, y: 11, skills: ["Text Classification", "Transformers", "Embeddings", "TF-IDF"] },
  { label: "Causal Inference", emoji: "🧬", color: "#bfe3d2", x: 87, y: 16, skills: ["ATE / CATE", "Mediation", "Counterfactuals", "DoWhy"] },
  { label: "High Performance ML", emoji: "⚡", color: "#f7d6a8", x: 10, y: 45, skills: ["Quantization", "Sparsity", "GPU Inference", "Triton"] },
  { label: "Deep Learning", emoji: "🧠", color: "#c5e0f5", x: 34, y: 47, skills: ["Neural Networks", "Transfer Learning", "PyTorch", "TensorFlow"] },
  { label: "Machine Learning", emoji: "🌼", color: "#d9eab0", x: 64, y: 47, skills: ["Regression", "Classification", "Unsupervised Learning", "scikit-learn", "XGBoost", "SHAP"] },
  { label: "Statistical Modeling", emoji: "📊", color: "#bfe3d2", x: 90, y: 45, skills: ["Hypothesis Testing", "A/B Testing", "Bayesian", "R"] },
  { label: "Computer Vision", emoji: "👁️", color: "#c5e0f5", x: 13, y: 83, skills: ["Image Classification", "Object Detection", "OpenCV"] },
  { label: "Web Development", emoji: "🌐", color: "#bfe0e3", x: 38, y: 88, skills: ["React", "Next.js", "TypeScript", "Tailwind", "FastAPI"] },
  { label: "Data & Cloud", emoji: "☁️", color: "#f8d4bd", x: 62, y: 88, skills: ["Python", "SQL", "Spark", "Databricks", "Docker", "AWS"] },
  { label: "Cybersecurity", emoji: "🔐", color: "#d4d7dd", x: 84, y: 83, skills: ["Anomaly Detection", "Malware Analysis", "Cryptography"] },
];

// hubs wired to each other, like a network
// 0 GenAI 1 Agentic 2 NLP 3 Causal 4 HPML 5 DL 6 ML 7 Stats
// 8 CV 9 WebDev 10 Data&Cloud 11 Cybersecurity
const clusterLinks: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 6], [6, 7], [2, 5],
  [5, 8], [6, 3], [6, 10], [10, 8], [10, 11], [0, 10], [3, 7],
  [9, 10], [0, 9], [9, 8],
];

const RX = 10; // node ring radius (% horizontal)
const RY = 11; // node ring radius (% vertical)
const START = [-2, -1.6, -1.5, -1.1, 0.4, 0.6, 0.6, 0.8, 1.4, 1.5, 1.6, 1.8];

type Node = { skill: string; x: number; y: number; ci: number };

const nodes: Node[] = clusters.flatMap((c, ci) =>
  c.skills.map((skill, k) => {
    const angle = (k / c.skills.length) * Math.PI * 2 + START[ci];
    return { skill, x: c.x + RX * Math.cos(angle), y: c.y + RY * Math.sin(angle), ci };
  }),
);

const clamp = (v: number) => Math.min(1.8, Math.max(0.5, v));

export default function SkillGraph() {
  const [scale, setScale] = useState(0.8);
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="relative mt-5 h-[520px] w-full overflow-hidden rounded-3xl border border-white/50 bg-white/25">
      <div className="flex h-full w-full items-center justify-center">
        <motion.div
          key={resetKey}
          drag
          dragMomentum={false}
          style={{ scale }}
          className="relative h-[760px] w-[1000px] shrink-0 cursor-grab active:cursor-grabbing"
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
            <motion.span
              key={`${n.skill}-${i}`}
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 4 + (i % 5) * 0.6, ease: "easeInOut" }}
              className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/70 bg-white/90 px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink-soft shadow-sm"
            >
              {n.skill}
            </motion.span>
          ))}
        </motion.div>
      </div>

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
      </div>

      <span className="pointer-events-none absolute bottom-3 left-4 font-body text-xs text-ink-soft/80">
        drag to explore · + / − to zoom
      </span>
    </div>
  );
}
