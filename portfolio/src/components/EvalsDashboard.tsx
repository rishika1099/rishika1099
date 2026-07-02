"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, animate, useInView } from "framer-motion";
import PageShell from "@/components/PageShell";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

function CountUp({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, { duration: 1.2, ease: "easeOut", onUpdate: setVal });
    return () => controls.stop();
  }, [inView, to]);
  return (
    <span ref={ref}>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

function MetricBar({ label, value, display }: { label: string; value: number; display: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div ref={ref} className="mb-3">
      <div className="flex items-center justify-between gap-3 font-body text-sm text-ink-soft">
        <span>{label}</span>
        <span className="shrink-0 font-semibold text-ink">{display}</span>
      </div>
      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-white/60">
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${Math.round(value * 100)}%` } : { width: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-blush to-lavender"
        />
      </div>
    </div>
  );
}

function Card({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section className="mt-8 rounded-3xl p-7 soft-card sm:p-8">
        <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
          <span className="mr-2">{emoji}</span>
          {title}
        </h2>
        <div className="mt-4 space-y-3 font-body text-[15px] leading-relaxed text-ink">{children}</div>
      </section>
    </Reveal>
  );
}

const SEARCH_ROWS: [string, string, number][] = [
  ["make LLMs run faster", "KV-Cache Optimization", 0.45],
  ["causal effect of a treatment", "Colon Cancer Trial Causal Analysis", 0.54],
  ["quantization and sparsity for transformer decoding", "KV-Cache Optimization", 0.38],
  ["gemini", "Dr. Pixel (only real match; rest dropped)", 0.25],
];

const MOODS: [string, number][] = [
  ["melancholy", 4],
  ["longing", 1],
  ["love", 1],
  ["self-love", 1],
  ["hope", 1],
];

export default function EvalsDashboard() {
  return (
    <PageShell vibe="aurora">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog/technical/under-the-hood" className="font-body text-sm text-ink-soft hover:text-ink">
          ← the full tour of these features
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-4 text-center"
        >
          <p className="font-body text-sm italic text-ink-soft">📊 live scoreboard</p>
          <h1 className="mt-2 bg-gradient-to-r from-[#c77dba] via-[#8e7bd6] to-[#6aa6d6] bg-clip-text font-display text-4xl font-bold leading-tight text-transparent sm:text-5xl">
            Evaluations
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-serif text-lg italic text-ink-soft">
            Every ML feature on this site ships with a way to measure its quality, not just assert
            it. This page is the latest snapshot.
          </p>
        </motion.div>

        {/* headline stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {[
            { n: <CountUp to={100} suffix="%" />, l: "chatbot eval (all 3 metrics)" },
            { n: <CountUp to={0.894} decimals={3} />, l: "poem mood confidence" },
            { n: <CountUp to={0.143} decimals={3} />, l: "photo cluster silhouette" },
            { n: <CountUp to={0} />, l: "hallucinated answers" },
          ].map((s, i) => (
            <div key={i} className="rounded-3xl p-4 text-center soft-card">
              <div className="font-display text-2xl font-bold text-ink sm:text-3xl">{s.n}</div>
              <div className="mt-1 font-body text-xs text-ink-soft">{s.l}</div>
            </div>
          ))}
        </motion.div>

        <Card emoji="💬" title="Ask-my-portfolio chatbot (RAG)">
          <p className="text-sm text-ink-soft">
            A hand-labeled question set run through the live endpoint (npm run eval:chat).
          </p>
          <div className="rounded-2xl bg-white/50 p-5">
            <MetricBar label="Retrieval hit rate: right chunk in top-k (10/10)" value={1} display="100%" />
            <MetricBar label="Answer accuracy: contains the expected fact (10/10)" value={1} display="100%" />
            <MetricBar label="Refusal correctness: declines out-of-scope (3/3)" value={1} display="100%" />
          </div>
          <p className="text-sm text-ink-soft">
            The refusal set (&ldquo;favorite poem?&rdquo;, &ldquo;phone number?&rdquo;, &ldquo;2024
            Super Bowl?&rdquo;) is out of scope on purpose: it declines all three and points to the
            Contact page, with zero hallucination.
          </p>
        </Card>

        <Card emoji="🔍" title="Semantic project search">
          <p className="text-sm text-ink-soft">
            Query and projects embedded with text-embedding-3-small, ranked by cosine; matches under
            0.24 are dropped instead of padding the list.
          </p>
          <div className="rounded-2xl bg-white/50 p-5">
            {SEARCH_ROWS.map(([q, hit, cos]) => (
              <MetricBar
                key={q}
                label={`"${q}" → ${hit}`}
                value={cos / 0.6}
                display={`cos ${cos.toFixed(2)}`}
              />
            ))}
          </div>
        </Card>

        <Card emoji="📸" title="Photo gallery clustering">
          <p className="text-sm text-ink-soft">
            CLIP image embeddings → k-means, with k chosen by silhouette score. Re-runs when a photo
            is added.
          </p>
          <div className="rounded-2xl bg-white/50 p-5">
            <MetricBar label="silhouette with caption-text embeddings" value={0.076 / 0.2} display="0.076" />
            <MetricBar label="silhouette with CLIP image embeddings" value={0.143 / 0.2} display="0.143" />
          </div>
          <p className="text-sm text-ink-soft">
            k = 4 clusters, sizes 15 / 8 / 6 / 2. The silhouette is modest because the photo set is
            visually homogeneous (cityscape-heavy); switching from caption text to CLIP image
            embeddings roughly doubled it and produced more meaningful groups.
          </p>
        </Card>

        <Card emoji="🕯️" title="Poem mood classification">
          <p className="text-sm text-ink-soft">
            Each poem is classified into one of eight moods with a confidence score (temperature 0,
            JSON output). Average confidence: <strong>0.894</strong> across 8 poems.
          </p>
          <div className="rounded-2xl bg-white/50 p-5">
            {MOODS.map(([m, n]) => (
              <MetricBar key={m} label={m} value={n / 8} display={`${n} poem${n > 1 ? "s" : ""}`} />
            ))}
          </div>
        </Card>

        <Card emoji="🌌" title="Embeddings galaxy (honest framing)">
          <p>
            The galaxy is an <strong>exploratory visualization, not a clustering claim</strong>. An
            earlier version ran k-means and had an LLM name the clusters; at near-zero silhouette the
            groups were fuzzy and mislabeled things, so the dots are now colored by their real
            technical area while the PCA layout still shows that similar projects land near each
            other.
          </p>
        </Card>

        <Reveal>
          <p className="my-10 text-center font-body text-sm text-ink-soft">
            Reproduce: <code className="rounded bg-white/60 px-1.5 py-0.5">npm run eval:chat</code>{" "}
            for the chatbot; clustering and mood metrics are written during{" "}
            <code className="rounded bg-white/60 px-1.5 py-0.5">npm run media</code>. ✦
          </p>
        </Reveal>
      </div>
    </PageShell>
  );
}
