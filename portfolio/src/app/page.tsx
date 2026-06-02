"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import FlowerPortrait from "@/components/FlowerPortrait";
import { useMode } from "@/components/ModeProvider";
import { copy } from "@/data/copy";

const tabs = [
  { href: "/about", icon: "🦦", title: "About", blurb: "the human behind the models" },
  { href: "/work", icon: "🌱", title: "Work", blurb: "projects, growing in a meadow" },
  { href: "/blog", icon: "🎐", title: "Blog", blurb: "essays, poems & photographs" },
  { href: "/contact", icon: "💌", title: "Contact", blurb: "let's say hello" },
];

export default function Home() {
  const { mode } = useMode();
  return (
    <PageShell vibe="dawn" className="flex min-h-[86vh] flex-col justify-center">
      {/* Hero: portrait on the left, name + words on the right */}
      <div className="flex flex-col items-center gap-8 text-center md:flex-row md:gap-14">
        <div className="shrink-0">
          <FlowerPortrait />
        </div>

        <div className="flex-1">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-serif text-lg italic text-ink-soft sm:text-xl"
          >
            {copy.home.greeting[mode]}
          </motion.p>

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
              Rishika
            </motion.span>
            <motion.span
              className="block"
              animate={{ y: [0, -6, 0], rotate: [1.5, -1.5, 1.5] }}
              transition={{ repeat: Infinity, duration: 7.5, ease: "easeInOut", delay: 0.6 }}
            >
              Mamidibathula
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mx-auto mt-6 max-w-xl font-body text-base text-ink-soft sm:text-lg"
          >
            {copy.home.bio[mode]}
          </motion.p>
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
