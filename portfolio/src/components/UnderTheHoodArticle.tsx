"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, animate, useInView } from "framer-motion";
import PageShell from "@/components/PageShell";

/* ---------- little building blocks ---------- */

// scroll-reveal wrapper
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

// count-up number that animates when scrolled into view
function CountUp({ to, suffix = "", decimals = 0 }: { to: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to]);
  return (
    <span ref={ref}>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// animated horizontal bar (0..1) that fills when in view
function MetricBar({ label, value, display }: { label: string; value: number; display: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div ref={ref} className="mb-3">
      <div className="flex items-center justify-between font-body text-sm text-ink-soft">
        <span>{label}</span>
        <span className="font-semibold text-ink">{display}</span>
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
      <div className="space-y-2 font-body text-[15px] leading-relaxed text-ink-soft">
        {children}
      </div>
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
        Illustrative cosine scores. Anything under {THRESHOLD} is treated as "no real match" and dropped,
        which is why a vague word still returns only what's genuinely relevant.
      </p>
    </div>
  );
}

/* ---------- the article ---------- */

export default function UnderTheHoodArticle() {
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
          <h1 className="mt-2 bg-gradient-to-r from-[#c77dba] via-[#8e7bd6] to-[#6aa6d6] bg-clip-text font-display text-4xl font-bold leading-tight text-transparent sm:text-5xl">
            The Data Science Hiding in My Portfolio
          </h1>
          <p className="mx-auto mt-4 max-w-xl font-serif text-lg italic text-ink-soft">
            This site isn&apos;t just a static page. Most of it is generated, organized, and answered
            by models, and every piece ships with an eval. Here&apos;s the tour, with the concepts
            explained.
          </p>
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
          <p className="mt-8 font-body text-base leading-relaxed text-ink">
            The content on this site is not only displayed, a lot of it is generated, organized, and
            answered by models. And because I care whether each piece actually works, almost every one
            ships with a small <strong>evaluation</strong>, so quality is measured, not assumed. Here is
            how each part works, with the concept behind it.
          </p>
        </Reveal>

        <Section id="embeddings" emoji="🧭" title="The one idea everything is built on: embeddings">
          <Concept>
            <p>
              An <strong>embedding</strong> turns text (or an image) into a list of numbers, a{" "}
              vector. A good model places similar meanings close together, even with
              no shared words: &ldquo;make LLMs faster&rdquo; and &ldquo;reduce inference latency&rdquo;
              land near each other.
            </p>
            <p>
              To measure &ldquo;close&rdquo; I use <strong>cosine similarity</strong>: the cosine of the
              angle between two vectors, from -1 (opposite) through 0 (unrelated) to 1 (identical). It
              cares about direction, not length, so a short phrase and a long paragraph on the same topic
              still match.
            </p>
          </Concept>
          <p>
            Once meaning becomes geometry, a lot gets simple: search is &ldquo;find the nearest
            vectors,&rdquo; recommendations are &ldquo;find neighbors,&rdquo; classification is
            &ldquo;which label is closest.&rdquo; Almost everything below is a variation on that move.
          </p>
        </Section>

        <Section id="rag" emoji="💬" title="Ask-my-portfolio chatbot (RAG)">
          <Concept>
            <p>
              <strong>Retrieval-augmented generation</strong> fixes the fact that LLMs confidently make
              things up. Instead of asking the model to recall facts, you retrieve the relevant
              source text first (by embedding similarity), then ask it to answer using only that
              text. It becomes a careful summarizer of real sources, not a fuzzy memory.
            </p>
          </Concept>
          <p>
            Grounded in my bio, experience, every project&apos;s GitHub README, and my Substack posts
            (poems and photos are private and excluded). Answers stream token-by-token, cite sources,
            and refuse when out of scope.
          </p>
          <div className="mt-4 rounded-2xl bg-white/50 p-5">
            <MetricBar label="Retrieval hit rate (right chunk in top-k)" value={1} display="100%" />
            <MetricBar label="Answer accuracy (contains the fact)" value={1} display="100%" />
            <MetricBar label="Refusal correctness (declines out-of-scope)" value={1} display="100%" />
          </div>
          <p className="text-sm text-ink-soft">
            The refusals (&ldquo;favorite poem?&rdquo;, &ldquo;phone number?&rdquo;, &ldquo;2024 Super
            Bowl?&rdquo;) are out of scope on purpose: it declines all three with zero hallucination.
          </p>
        </Section>

        <Section id="search" emoji="🔍" title="Semantic search across my projects">
          <Concept>
            <p>
              <strong>Semantic search</strong> ranks by meaning, not keyword overlap, so &ldquo;make LLMs
              run faster&rdquo; finds &ldquo;KV-Cache Optimization&rdquo; despite zero shared words. Two
              details matter: a <strong>threshold</strong> (drop weak matches, since unrelated text still
              scores ~0.15, not 0), and rescaling the raw cosine into a friendlier percentage.
            </p>
          </Concept>
          <SearchDemo />
        </Section>

        <Section id="galaxy" emoji="🌌" title="The embeddings galaxy (PCA)">
          <Concept>
            <p>
              Embeddings live in hundreds of dimensions, which you can&apos;t draw.{" "}
              <strong>PCA</strong> finds the directions of greatest variation and projects everything onto
              the top two, giving an x and y to plot while keeping as much real spread as possible. I
              compute it by hand via the <strong>Gram matrix</strong> and power iteration, no library.
            </p>
          </Concept>
          <p>
            Similar projects drift near each other, so the model roughly rediscovers my technical areas
            from text alone. An earlier version ran k-means and let an LLM name the clusters, but at
            near-zero separation it mislabeled things (a car-price project once landed in a
            &ldquo;Computer Vision&rdquo; cluster). So I color each dot by its real area instead.
            The layout shows the structure; the colors stay honest.
          </p>
        </Section>

        <Section id="tagging" emoji="🏷️" title="Auto-pulled blog with embedding zero-shot tagging">
          <Concept>
            <p>
              <strong>Zero-shot classification</strong> labels things with no training examples:
              describe each label in words, embed the descriptions and the post, and the closest label
              wins. Two refinements make it robust. <strong>Multi-prototype labels</strong>: average a few
              phrasings per category to cancel noise. And a <strong>confidence rule</strong> instead of
              blind argmax: a domain is attached only when it clears a floor and clearly beats the
              runner-up. When two are close, that&apos;s ambiguity, so it tags none. Precision over recall.
            </p>
          </Concept>
          <p>
            This replaced a brittle keyword system that once tagged an encryption post as
            &ldquo;Food &amp; Nutrition&rdquo; because the intro mentioned my cat&apos;s empty food bowl. I
            weight the <strong>title 2x</strong> in the embedded text, and this very post tagged itself.
          </p>
        </Section>

        <Section id="clustering" emoji="📸" title="Photo clustering (k-means + silhouette + CLIP)">
          <Concept>
            <p>
              <strong>k-means</strong> groups without labels: place k centers, assign each point to its
              nearest, move centers to the mean, repeat. The <strong>silhouette score</strong> (-1 to 1)
              picks the best k by comparing in-cluster tightness to the nearest other cluster.{" "}
              <strong>CLIP</strong> puts images and captions in a shared space, so a CLIP image embedding
              captures visual content directly.
            </p>
          </Concept>
          <div className="mt-4 rounded-2xl bg-white/50 p-5">
            <MetricBar label="silhouette with caption-text embeddings" value={0.076 / 0.2} display="0.076" />
            <MetricBar label="silhouette with CLIP image embeddings" value={0.143 / 0.2} display="0.143" />
          </div>
          <p className="text-sm text-ink-soft">
            Switching from caption text to CLIP image embeddings roughly doubled the silhouette
            and produced more meaningful groups. The pixels knew something the captions didn&apos;t.
          </p>
        </Section>

        <Section id="llm" emoji="✨" title="The smaller LLM touches">
          <Concept>
            <p>
              A few features use an LLM as a function, not a chatbot: a strict instruction,{" "}
              <strong>temperature 0</strong> (minimum randomness, repeatable output), and structured{" "}
              <strong>JSON</strong>. Constrained like that, it becomes a reliable little classifier or
              rewriter.
            </p>
          </Concept>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Poem mood classification</strong> into eight moods with a confidence score; average{" "}
              <strong>0.894</strong> across 8 poems, reported on the page.
            </li>
            <li>
              <strong>AI poem art</strong>: a model distills each poem into one evocative prompt, an image
              model renders it, cached forever.
            </li>
            <li>
              <strong>Auto-captioned photos</strong> via a vision model, low-detail to stay cheap.
            </li>
            <li>
              <strong>ELI5 / expert toggle</strong> rewrites every blurb for a 10-year-old or a senior
              engineer, under a strict &ldquo;keep every fact truthful&rdquo; rule.
            </li>
          </ul>
        </Section>

        <Section id="engineering" emoji="🛠️" title="The engineering around it">
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong>Caching + ISR.</strong> Embeddings, art, captions, and rewrites are computed once;
              GitHub and Substack refresh hourly, so the site stays fresh without re-paying every request.
            </li>
            <li>
              <strong>Batched calls.</strong> Labels and classifications go out in one batched call, not
              one-per-item.
            </li>
            <li>
              <strong>Graceful fallback.</strong> The live embedding classifier has a deterministic keyword
              backup, so a flaky API degrades quality instead of breaking the page.
            </li>
            <li>
              <strong>Evals as a habit.</strong> If I can&apos;t measure it, I try not to claim it.
            </li>
          </ul>
        </Section>

        <Reveal>
          <p className="my-12 text-center font-serif text-xl italic text-ink-soft">
            That is the whole machine: it embeds, retrieves, clusters, classifies, and grades its own
            homework. Thanks for reading the tour. 🌸
          </p>
        </Reveal>
      </div>
    </PageShell>
  );
}
