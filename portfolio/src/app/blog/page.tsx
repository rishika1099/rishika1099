"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";

const doors = [
  {
    href: "/blog/technical",
    icon: "📓",
    title: "Technical Blogs",
    blurb: "ideas that refused to stay inside a notebook 💡",
    tint: "bg-mint/50",
  },
  {
    href: "/blog/poems",
    icon: "🕯️",
    title: "Poems",
    blurb: "a collection of midnight thoughts and daylight edits ☁️",
    tint: "bg-lavender/60",
    locked: true,
  },
  {
    href: "/blog/photography",
    icon: "📷",
    title: "Photography",
    blurb: "sunsets, sidewalks, and other things that caught my eye ✨",
    tint: "bg-dawn/60",
  },
];

export default function BlogHub() {
  return (
    <PageShell vibe="peach">
      <PageTitle>the writing room 📖</PageTitle>
      <p className="mt-3 max-w-4xl font-body text-lg text-ink-soft">
        Three little doors. One for curiosity, one for feelings, one for the
        moments I wanted to keep. They began as scattered notes, late-night
        thoughts, and photographs. Somehow, they all ended up here. ✨
      </p>

      <div className="mt-9 grid gap-5 sm:grid-cols-3">
        {doors.map((d, i) => (
          <motion.div
            key={d.href}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -8, rotate: i === 1 ? 0 : i ? 1.5 : -1.5 }}
          >
            <Link
              href={d.href}
              className={`flex h-full flex-col items-center gap-2 rounded-[2rem] p-8 text-center soft-card ${d.tint}`}
            >
              <span className="animate-float-med text-5xl">{d.icon}</span>
              <span className="mt-1 flex items-center gap-1.5 font-display text-xl font-semibold text-ink">
                {d.title}
                {d.locked && <span className="text-sm">🔒</span>}
              </span>
              <span className="font-body text-base text-ink-soft">{d.blurb}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* featured: the meta post about how this site is built */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-8"
      >
        <Link
          href="/blog/technical/under-the-hood"
          className="block overflow-hidden rounded-[2rem] border border-lavender/40 bg-gradient-to-br from-mint/30 via-lavender/25 to-blush/25 p-7 soft-card transition hover:-translate-y-1"
        >
          <p className="font-body text-sm italic text-ink-soft">📌 featured</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
            The Data Science Hiding in My Portfolio ✨
          </h2>
          <p className="mt-2 max-w-2xl font-body text-base text-ink-soft">
            A tour of the ML and LLM pipelines behind this whole site, with the concepts
            explained, a live demo, and an eval for every claim.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              ["RAG", "bg-blush/50"],
              ["Embeddings", "bg-lavender/50"],
              ["Zero-shot", "bg-mint/60"],
              ["PCA", "bg-dawn/60"],
              ["Clustering", "bg-petal/50"],
            ].map(([t, tint]) => (
              <span
                key={t}
                className={`rounded-full ${tint} px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink`}
              >
                {t}
              </span>
            ))}
          </div>
          <span className="mt-3 inline-block font-body text-sm font-semibold text-[#c77dba]">
            read the tour →
          </span>
        </Link>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="mx-auto mt-12 max-w-xl text-center font-body text-base text-ink-soft"
      >
        And while you&apos;re here, check out{" "}
        <a
          href="https://blog-praj3sh.web.app/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[#c77dba] underline hover:text-ink"
        >
          this neighboring corner of the internet
        </a>
        .
        <br />
        (A totally unbiased recommendation, of course. 😌✨)
      </motion.p>
    </PageShell>
  );
}
