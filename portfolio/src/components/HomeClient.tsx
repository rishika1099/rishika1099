"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import FlowerPortrait from "@/components/FlowerPortrait";

const tabs = [
  { href: "/about", icon: "🦦", title: "About", blurb: "the human behind the models" },
  { href: "/work", icon: "🌱", title: "Work", blurb: "projects, growing in a meadow" },
  { href: "/blog", icon: "🎐", title: "Blog", blurb: "essays, poems & photographs" },
  { href: "/contact", icon: "💌", title: "Contact", blurb: "let's say hello" },
];

export default function HomeClient({
  name1,
  name2,
  greeting,
  intro,
  resumeSlot,
  portraitOverlay,
}: {
  name1: React.ReactNode;
  name2: React.ReactNode;
  greeting: React.ReactNode;
  intro: React.ReactNode;
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-serif text-lg italic text-ink-soft sm:text-xl md:hidden"
        >
          {greeting}
        </motion.div>

        <div className="flex shrink-0 flex-col items-center gap-7">
          <div className="relative">
            <FlowerPortrait />
            {portraitOverlay}
          </div>
          <div className="flex flex-col items-center gap-2.5">
            {resumeSlot ?? (
              <motion.a
                href="/resume"
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center rounded-full bg-white/75 px-5 py-2 font-body text-base font-bold text-ink shadow-sm backdrop-blur transition hover:bg-white"
              >
                Resume
              </motion.a>
            )}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
            >
              <Link
                href="/blog/technical/under-the-hood"
                className="inline-flex items-center gap-1.5 rounded-full bg-lavender/70 px-5 py-2 font-body text-base font-semibold text-ink shadow-sm backdrop-blur transition hover:bg-lavender"
              >
                ✨ explore features
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden font-serif text-lg italic text-ink-soft sm:text-xl md:block"
          >
            {greeting}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 120 }}
            className="mt-10 flex flex-col items-center gap-6 font-name text-[2.1rem] font-normal leading-[1.15] text-ink text-shadow-soft sm:mt-14 sm:text-6xl"
          >
            <motion.span
              className="block"
              animate={{ y: [0, -8, 0], rotate: [-1.5, 1.5, -1.5] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            >
              {name1}
            </motion.span>
            <motion.span
              className="block"
              animate={{ y: [0, -6, 0], rotate: [1.5, -1.5, 1.5] }}
              transition={{ repeat: Infinity, duration: 7.5, ease: "easeInOut", delay: 0.6 }}
            >
              {name2}
            </motion.span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mx-auto mt-6 max-w-xl font-body text-base text-ink-soft sm:text-lg"
          >
            {intro}
          </motion.div>
        </div>
      </div>

      {/* Tab cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-10 grid w-full grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {tabs.map((t, i) => (
          <motion.div
            key={t.href}
            whileHover={{ y: -6, rotate: i % 2 ? 2 : -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Link
              href={t.href}
              className="flex h-full flex-col items-center gap-1 rounded-3xl p-5 text-center soft-card"
            >
              <span className="animate-float-med text-4xl">{t.icon}</span>
              <span className="mt-1 font-body text-xl font-bold text-ink">
                {t.title}
              </span>
              <span className="font-body text-sm text-ink-soft">{t.blurb}</span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </PageShell>
  );
}
