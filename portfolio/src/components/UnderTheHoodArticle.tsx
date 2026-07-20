"use client";

// The under-the-hood tour. Every prose passage is a copy block (page: tour),
// so the article is editable like the rest of the site: the live page passes
// rendered HTML in `passages`, the editor passes a `renderSlot` that swaps
// each passage for an ink-editor box. Structure (stats, bars, demo) is code.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, animate, useInView } from "framer-motion";
import PageShell from "@/components/PageShell";

/* ---------- little building blocks ---------- */

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

function Concept({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-5 rounded-2xl border border-lavender/40 bg-lavender/15 p-5">
      <p className="mb-2 font-body text-xs font-bold uppercase tracking-wide text-[#6a5aa0]">
        💡 the concept
      </p>
      <div className="space-y-2 font-body text-[15px] leading-relaxed text-ink-soft">{children}</div>
    </div>
  );
}

function Section({ id, emoji, title, children }: { id: string; emoji: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <Reveal>
        <div className="rounded-3xl p-7 soft-card sm:p-9">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            <span className="mr-2">{emoji}</span>
            {title}
          </h2>
          <div className="mt-4 space-y-3 font-body text-[15px] leading-relaxed text-ink sm:text-base">
            {children}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- interactive semantic-search demo ---------- */

const DEMO: Record<string, [string, number][]> = {
  "make LLMs run faster": [
    ["⚡ KV-Cache Optimization", 0.45],
    ["📚 Folio (clinical RAG)", 0.26],
    ["🌸 This Portfolio", 0.22],
  ],
  "causal effect of a treatment": [
    ["🧬 Colon Cancer Trial Causal Analysis", 0.54],
    ["📚 Folio (clinical RAG)", 0.24],
    ["👁️ Dr. Pixel", 0.2],
  ],
  "read legal documents": [
    ["⚖️ Federal Eagle: AI Legal Assistant", 0.49],
    ["📚 Folio (clinical RAG)", 0.23],
    ["🌸 This Portfolio", 0.19],
  ],
  "what can I cook tonight": [
    ["🍳 Ruchi: Pantry-to-Plate Intelligence", 0.47],
    ["👁️ Dr. Pixel", 0.18],
    ["⚡ KV-Cache Optimization", 0.16],
  ],
};
const THRESHOLD = 0.24;

function SearchDemo() {
  const queries = Object.keys(DEMO);
  const [q, setQ] = useState(queries[0]);
  const results = DEMO[q];
  return (
    <div className="mt-5 rounded-2xl border border-mint/40 bg-mint/10 p-5">
      <p className="font-body text-sm font-semibold text-ink-soft">
        🔍 try it: pick a search, watch it rank by meaning
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {queries.map((query) => (
          <button
            key={query}
            type="button"
            onClick={() => setQ(query)}
            className={`rounded-full px-3.5 py-1.5 font-body text-sm font-semibold transition ${
              q === query ? "bg-ink text-cream" : "bg-white/70 text-ink-soft hover:bg-white"
            }`}
          >
            {query}
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-3">
        {results.map(([name, score], i) => {
          const weak = score < THRESHOLD;
          return (
            <div key={name} className={weak ? "opacity-45" : ""}>
              <div className="flex items-center justify-between font-body text-sm">
                <span className="text-ink">{name}</span>
                <span className="font-semibold text-ink-soft">
                  cos {score.toFixed(2)}
                  {weak && " · dropped"}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/60">
                <motion.div
                  key={q + name}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((score / 0.6) * 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.08 }}
                  className={`h-full rounded-full ${
                    weak ? "bg-ink-soft/30" : "bg-gradient-to-r from-mint to-lavender"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 font-body text-xs italic text-ink-soft/70">
        Illustrative cosine scores. Anything under {THRESHOLD} is treated as &ldquo;no real match&rdquo; and
        dropped, which is why a vague word still returns only what&apos;s genuinely relevant.
      </p>
    </div>
  );
}

/* ---------- the article ---------- */

export default function UnderTheHoodArticle({
  passages = {},
  renderSlot,
  titleNode,
}: {
  passages?: Record<string, string>;
  renderSlot?: (id: string, className?: string) => React.ReactNode;
  /** the article title, rendered inside the <h1> (an editor can't nest there) */
  titleNode?: React.ReactNode;
}) {
  const slot = (id: string, className = "") =>
    renderSlot ? (
      renderSlot(id, className)
    ) : (
      <span
        className={`rich-passage block ${className}`}
        dangerouslySetInnerHTML={{ __html: passages[id] ?? "" }}
      />
    );

  return (
    <PageShell vibe="aurora">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog/technical" className="font-body text-sm text-ink-soft hover:text-ink">
          ← all technical blogs
        </Link>

        {/* hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-4 text-center"
        >
          <p className="font-body text-sm italic text-ink-soft">📌 pinned · a tour of the build</p>
          {renderSlot ? (
            // edit mode: the title itself is the editor, no duplicate box
            <div className="mx-auto mt-2 max-w-2xl text-left">
              {slot("tour.title", "font-display text-3xl font-bold text-ink sm:text-4xl")}
            </div>
          ) : (
            <h1 className="mt-2 bg-gradient-to-r from-[#c77dba] via-[#8e7bd6] to-[#6aa6d6] bg-clip-text font-display text-4xl font-bold leading-tight text-transparent sm:text-5xl">
              {titleNode ?? "The Data Science Hiding in My Portfolio"}
            </h1>
          )}
          <div className="mx-auto mt-4 max-w-xl">
            {slot("tour.hero", "font-serif text-lg italic text-ink-soft")}
          </div>
        </motion.div>

        {/* animated stat strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {[
            { n: <CountUp to={100} suffix="%" />, l: "chatbot accuracy" },
            { n: <CountUp to={12} />, l: "ML/LLM features" },
            { n: <CountUp to={0.894} decimals={2} />, l: "mood confidence" },
            { n: <CountUp to={0} suffix="" />, l: "hallucinations" },
          ].map((s, i) => (
            <div key={i} className="rounded-3xl p-4 text-center soft-card">
              <div className="font-display text-2xl font-bold text-ink sm:text-3xl">{s.n}</div>
              <div className="mt-1 font-body text-xs text-ink-soft">{s.l}</div>
            </div>
          ))}
        </motion.div>

        <Reveal delay={0.1}>
          <div className="mt-8">{slot("tour.lead", "font-body text-base leading-relaxed text-ink")}</div>
        </Reveal>

        <Section id="embeddings" emoji="🧭" title="The one idea everything is built on: embeddings">
          <Concept>{slot("tour.embed.concept")}</Concept>
          {slot("tour.embed.body")}
        </Section>

        <Section id="rag" emoji="💬" title="Ask-my-portfolio chatbot (RAG)">
          <Concept>{slot("tour.rag.concept")}</Concept>
          {slot("tour.rag.grounded")}
          {slot("tour.rag.memory")}
          <div className="mt-4 rounded-2xl bg-white/50 p-5">
            <MetricBar label="Retrieval hit rate (right chunk in top-k)" value={1} display="100%" />
            <MetricBar label="Answer accuracy (contains the fact)" value={1} display="100%" />
            <MetricBar label="Refusal correctness (declines out-of-scope)" value={1} display="100%" />
          </div>
          {slot("tour.rag.refusals", "text-sm text-ink-soft")}
        </Section>

        <Section id="search" emoji="🔍" title="Semantic search across my projects">
          <Concept>{slot("tour.search.concept")}</Concept>
          <SearchDemo />
        </Section>

        <Section id="galaxy" emoji="🌌" title="The embeddings galaxy (PCA)">
          <Concept>{slot("tour.galaxy.concept")}</Concept>
          {slot("tour.galaxy.body")}
          {slot("tour.galaxy.pop")}
          {slot("tour.galaxy.you")}
        </Section>

        <Section id="tagging" emoji="🏷️" title="Auto-pulled blog with embedding zero-shot tagging">
          <Concept>{slot("tour.tag.concept")}</Concept>
          {slot("tour.tag.body")}
          {slot("tour.tag.pills")}
          {slot("tour.tag.rules")}
          {slot("tour.tag.emoji")}
        </Section>

        <Section id="clustering" emoji="📸" title="Photo clustering (k-means + silhouette + CLIP)">
          <Concept>{slot("tour.cluster.concept")}</Concept>
          <div className="mt-4 rounded-2xl bg-white/50 p-5">
            <MetricBar label="silhouette with caption-text embeddings" value={0.076 / 0.2} display="0.076" />
            <MetricBar label="silhouette with CLIP image embeddings" value={0.143 / 0.2} display="0.143" />
          </div>
          {slot("tour.cluster.note", "text-sm text-ink-soft")}
        </Section>

        <Section id="llm" emoji="✨" title="The smaller LLM touches">
          <Concept>{slot("tour.llm.concept")}</Concept>
          <ul className="ml-5 list-disc space-y-2">
            <li>{slot("tour.llm.b1")}</li>
            <li>{slot("tour.llm.b2")}</li>
            <li>{slot("tour.llm.b3")}</li>
            <li>{slot("tour.llm.b4")}</li>
            <li>{slot("tour.llm.b5")}</li>
          </ul>
        </Section>

        <Section id="engineering" emoji="🛠️" title="The engineering around it">
          <ul className="ml-5 list-disc space-y-2">
            <li>{slot("tour.eng.b1")}</li>
            <li>{slot("tour.eng.b2")}</li>
            <li>{slot("tour.eng.b3")}</li>
            <li>{slot("tour.eng.b4")}</li>
            <li>{slot("tour.eng.b5")}</li>
          </ul>
        </Section>

        <Reveal>
          <div className="my-12 text-center">
            {slot("tour.close", "font-serif text-xl italic text-ink-soft")}
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
