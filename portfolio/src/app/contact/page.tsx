"use client";

import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";

const links = [
  { icon: "✉️", label: "Email", value: "rm4318@columbia.edu", href: "mailto:rm4318@columbia.edu" },
  { icon: "💼", label: "LinkedIn", value: "in/rishika-mamidibathula", href: "https://linkedin.com/in/rishika-mamidibathula" },
  { icon: "🐙", label: "GitHub", value: "github.com/rishika1099", href: "https://github.com/rishika1099" },
  { icon: "📰", label: "Substack", value: "rishikamamidibathula.substack.com", href: "https://rishikamamidibathula.substack.com" },
];

export default function Contact() {
  return (
    <PageShell vibe="sunset" className="flex flex-col items-center text-center">
      <motion.span
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="text-6xl"
      >
        🏮
      </motion.span>
      <h1 className="mt-3 font-display text-4xl font-bold text-ink sm:text-5xl">
        let&apos;s say hello 💌
      </h1>
      <p className="mt-3 max-w-xl font-body text-lg text-ink-soft">
        Whether it&apos;s a role, a research idea, a poem you loved, or just a
        nice photo of the sky — my inbox is always open.
      </p>

      <div className="mt-9 grid w-full max-w-xl gap-4 sm:grid-cols-2">
        {links.map((l, i) => (
          <motion.a
            key={l.label}
            href={l.href}
            target={l.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -5, rotate: i % 2 ? 1.5 : -1.5 }}
            className="flex items-center gap-3 rounded-3xl p-5 text-left soft-card"
          >
            <span className="text-3xl">{l.icon}</span>
            <span>
              <span className="block font-display font-semibold text-ink">
                {l.label}
              </span>
              <span className="font-body text-sm text-ink-soft">{l.value}</span>
            </span>
          </motion.a>
        ))}
      </div>

      <p className="mt-12 font-hand text-xl text-ink-soft">
        made with pastel skies & too much tea ✦
      </p>
    </PageShell>
  );
}
