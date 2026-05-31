"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";

const tabs = [
  { href: "/about", icon: "🍵", title: "About", blurb: "the human behind the models" },
  { href: "/work", icon: "🌱", title: "Work", blurb: "32 projects, growing in a meadow" },
  { href: "/blog", icon: "🕯️", title: "Blog", blurb: "essays, poems & photographs" },
  { href: "/contact", icon: "💌", title: "Contact", blurb: "let's say hello" },
];

export default function Home() {
  return (
    <PageShell vibe="dawn" className="flex flex-col items-center text-center">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-serif text-xl italic text-ink-soft sm:text-2xl"
      >
        hi, the internet! welcome to my little corner ✦
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, type: "spring", stiffness: 120 }}
        className="mt-6 flex flex-col items-center gap-3 font-name text-5xl font-normal leading-none text-ink text-shadow-soft sm:mt-8 sm:gap-6 sm:text-7xl"
      >
        <motion.span
          className="block"
          animate={{ y: [0, -9, 0], rotate: [-1.5, 1.5, -1.5] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        >
          Rishika
        </motion.span>
        <motion.span
          className="block"
          animate={{ y: [0, -7, 0], rotate: [1.5, -1.5, 1.5] }}
          transition={{
            repeat: Infinity,
            duration: 7.5,
            ease: "easeInOut",
            delay: 0.6,
          }}
        >
          Mamidibathula
        </motion.span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-5 max-w-xl font-body text-lg text-ink-soft sm:text-xl"
      >
        Data scientist & ML engineer in New York 🗽 — I teach machines to be
        helpful, and on weekends I write poems and chase good light with a
        camera.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-9 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {tabs.map((t, i) => (
          <motion.div
            key={t.href}
            whileHover={{ y: -6, rotate: i % 2 ? 2 : -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Link
              href={t.href}
              className="flex h-full flex-col items-center gap-1 rounded-3xl p-5 soft-card"
            >
              <span className="animate-float-med text-4xl">{t.icon}</span>
              <span className="mt-1 font-display text-lg font-semibold text-ink">
                {t.title}
              </span>
              <span className="font-body text-xs text-ink-soft">{t.blurb}</span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </PageShell>
  );
}
