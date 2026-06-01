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
    <PageShell vibe="cozy">
      <PageTitle>the writing room ✍️</PageTitle>
      <p className="mt-3 max-w-2xl font-body text-lg text-ink-soft">
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
    </PageShell>
  );
}
