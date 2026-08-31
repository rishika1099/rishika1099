"use client";

import Link from "next/link";
import { m } from "framer-motion";
import PageShell from "@/components/PageShell";
import FlowerPortrait from "@/components/FlowerPortrait";

const tabs = [
  { href: "/about", title: "About", key: "about" },
  { href: "/work", title: "Work", key: "work" },
  { href: "/blog", title: "Blog", key: "blog" },
  { href: "/contact", title: "Contact", key: "contact" },
];

export default function HomeClient({
  name1,
  name2,
  greeting,
  intro,
  recruiterLine,
  tabBlurbs,
  tabIcons,
  resumeSlot,
  portraitOverlay,
}: {
  name1: React.ReactNode;
  name2: React.ReactNode;
  greeting: React.ReactNode;
  intro: React.ReactNode;
  /** the line pointing someone hiring at /recruiter */
  recruiterLine?: React.ReactNode;
  /** the four landing-card blurbs, keyed about/work/blog/contact */
  tabBlurbs: Record<string, React.ReactNode>;
  /** the four landing-card emojis, keyed about/work/blog/contact */
  tabIcons: Record<string, React.ReactNode>;
  /** edit mode swaps the Resume button for an upload control */
  resumeSlot?: React.ReactNode;
  /** edit mode floats a replace-photo control over the portrait */
  portraitOverlay?: React.ReactNode;
}) {
  return (
    <PageShell vibe="dawn" className="flex min-h-[86vh] flex-col justify-center">
      {/* Hero: portrait on the left, name + words on the right */}
      <div className="flex flex-col items-center gap-8 text-center md:flex-row md:gap-14">
        {/* greeting leads on mobile (above the photo) */}
        <m.div
          initial={{ y: 10 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-serif text-lg italic text-ink-soft sm:text-xl md:hidden"
        >
          {greeting}
        </m.div>

        <div className="flex shrink-0 flex-col items-center gap-7">
          <div className="relative">
            <FlowerPortrait />
            {portraitOverlay}
          </div>
          <div className="flex flex-col items-center gap-2.5">
            {resumeSlot ?? (
              <m.a
                href="/resume"
                target="_blank"
                rel="noreferrer"
                initial={{ y: 8 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center rounded-full bg-white/75 px-5 py-2 font-body text-base font-bold text-ink shadow-sm backdrop-blur transition hover:bg-white"
              >
                Resume
              </m.a>
            )}
            <m.div
              initial={{ y: 8 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
            >
              <Link
                href="/blog/technical/under-the-hood"
                className="inline-flex items-center gap-1.5 rounded-full bg-lavender/70 px-5 py-2 font-body text-base font-semibold text-ink shadow-sm backdrop-blur transition hover:bg-lavender"
              >
                ✨ explore features
              </Link>
            </m.div>
          </div>
        </div>

        <div className="flex-1">
          <m.div
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden font-serif text-lg italic text-ink-soft sm:text-xl md:block"
          >
            {greeting}
          </m.div>

          <m.h1
            // painted immediately: this is the largest thing on the page, and
            // fading it in delays the largest-contentful-paint by the whole
            // animation. The spring is on scale only, which costs nothing.
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 120 }}
            className="mt-10 flex flex-col items-center gap-6 font-name text-[2.1rem] font-normal leading-[1.15] text-ink text-shadow-soft sm:mt-14 sm:text-6xl"
          >
            <m.span
              className="block"
              animate={{ y: [0, -8, 0], rotate: [-1.5, 1.5, -1.5] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              {name1}
            </m.span>
            <m.span
              className="block"
              animate={{ y: [0, -6, 0], rotate: [1.5, -1.5, 1.5] }}
              transition={{ repeat: Infinity, duration: 7.5, ease: "easeInOut", delay: 0.6 }}
            >
              {name2}
            </m.span>
          </m.h1>

          <m.div
            // likewise: the intro paragraph is the single biggest element, so it
            // renders at once and only slides a little
            initial={{ y: 6 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.4 }}
            className="mx-auto mt-6 max-w-xl font-body text-base text-ink-soft sm:text-lg"
          >
            {intro}
          </m.div>
        </div>
      </div>

      {/* Tab cards */}
      <m.div
        initial={{ y: 12 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-10 grid w-full grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {tabs.map((t, i) => (
          <m.div
            key={t.href}
            whileHover={{ y: -6, rotate: i % 2 ? 2 : -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Link
              href={t.href}
              className="flex h-full flex-col items-center gap-1 rounded-3xl p-5 text-center soft-card"
            >
              <span className="animate-float-med text-4xl">{tabIcons[t.key]}</span>
              <span className="mt-1 font-body text-xl font-bold text-ink">
                {t.title}
              </span>
              <span className="font-body text-sm text-ink-soft">{tabBlurbs[t.key]}</span>
            </Link>
          </m.div>
        ))}
      </m.div>

      {/* a peek at the living /now page */}
      <m.div
        initial={{ y: 10 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.95 }}
        className="mt-6 flex flex-wrap items-center justify-center gap-3"
      >
        <Link
          href="/now"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-5 py-2 font-body text-sm font-semibold text-ink-soft shadow-sm backdrop-blur transition hover:bg-white hover:text-ink"
        >
          🧭 check what i&apos;m working on now →
        </Link>
        {recruiterLine && (
          <Link
            href="/recruiter"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-5 py-2 font-body text-sm font-semibold text-ink-soft shadow-sm backdrop-blur transition hover:bg-white hover:text-ink"
          >
            {recruiterLine}
          </Link>
        )}
      </m.div>
    </PageShell>
  );
}
