"use client";

import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";

const links = [
  { icon: "✉️", label: "Email", value: "rm4318@columbia.edu", href: "mailto:rm4318@columbia.edu" },
  { icon: "💼", label: "LinkedIn", value: "in/rishika-mamidibathula", href: "https://linkedin.com/in/rishika-mamidibathula" },
  { icon: "🐙", label: "GitHub", value: "github.com/rishika1099", href: "https://github.com/rishika1099" },
  { icon: "📰", label: "Substack", value: "rishika1099.substack.com", href: "https://rishika1099.substack.com" },
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
      <PageTitle className="mt-3 text-ink">let&apos;s say hello 💌</PageTitle>
      <p className="mt-3 max-w-xl font-body text-lg text-ink-soft">
        Whether it&apos;s a role, a research idea, a poem you loved, or just a
        nice photo of the sky, my inbox is always open.
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

      <p className="mt-12 font-serif text-xl italic text-ink-soft">
        made with pastel skies &amp; too much tea ✦
      </p>
    </PageShell>
  );
}
