"use client";

import Image from "next/image";
import { useFeatureCopy } from "./FeatureCopy";
import styles from "./FeaturedPost.module.css";
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
  const t = useFeatureCopy();
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
          className={`${styles.card} overflow-hidden rounded-[2rem] border border-lavender/40 p-7 soft-card`}
        >
          <div className={styles.copy}>
          <p className="font-body text-sm italic text-ink-soft">{t("blog.featured.label")}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
            {t("blog.featured.title")}
          </h2>
          <p className="mt-2 max-w-2xl font-body text-base text-ink-soft">
            {t("blog.featured.description")}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              ["rag", "bg-blush/50"],
              ["embeddings", "bg-lavender/50"],
              ["zeroShot", "bg-mint/60"],
              ["pca", "bg-dawn/60"],
              ["clustering", "bg-petal/50"],
            ].map(([tag, tint]) => (
              <span
                key={tag}
                className={`rounded-full ${tint} px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink`}
              >
                {t(`blog.featured.tag.${tag}`)}
              </span>
            ))}
          </div>
          <span className="mt-3 inline-block font-body text-sm font-semibold text-[#c77dba]">
            {t("blog.featured.link")}
          </span>
          </div>
          <div className={styles.mascot} aria-hidden="true"><Image src="/illustrations/portfolio-bot.webp" alt="" width={640} height={640} sizes="(max-width: 600px) 160px, 300px" unoptimized loading="lazy" /></div>
        </Link>
      </m.div>
    </PageShell>
  );
}
