"use client";

import Link from "next/link";
import { m } from "framer-motion";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import BlogDoorCard from "@/components/BlogDoorCard";

const doors = [
  { href: "/blog/technical", key: "technical", title: "Technical Blogs" },
  { href: "/blog/poems", key: "poems", title: "Poems", locked: true },
  { href: "/blog/photography", key: "photography", title: "Photography" },
] as const;

export default function BlogHubClient({
  title,
  intro,
  doorBlurbs,
}: {
  title: React.ReactNode;
  intro: React.ReactNode;
  doorBlurbs: Record<string, React.ReactNode>;
}) {
  return (
    <PageShell vibe="peach">
      <PageTitle>{title}</PageTitle>
      <div className="mt-3 max-w-4xl font-body text-lg text-ink-soft">{intro}</div>

      <div className="mt-9 grid gap-5 sm:grid-cols-3">
        {doors.map(door => <BlogDoorCard key={door.key} scene={door.key} href={door.href} title={door.title} blurb={doorBlurbs[door.key]} locked={door.key === "poems"} />)}
      </div>

      {/* featured: the meta post about how this site is built */}
      <m.div
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
      </m.div>
    </PageShell>
  );
}
