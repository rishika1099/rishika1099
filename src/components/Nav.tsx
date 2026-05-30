"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

const links = [
  { href: "/", label: "Home", icon: "🌤️" },
  { href: "/about", label: "About", icon: "🍵" },
  { href: "/work", label: "Work", icon: "🌱" },
  { href: "/blog", label: "Blog", icon: "🕯️" },
  { href: "/contact", label: "Contact", icon: "🌅" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50">
      <nav className="mx-auto mt-3 flex max-w-5xl items-center justify-between rounded-full px-4 py-2 soft-card sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-bold text-ink"
        >
          <motion.span
            animate={{ rotate: [0, -12, 12, 0] }}
            transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.8 }}
            className="text-2xl"
          >
            🐈
          </motion.span>
          <span className="hidden sm:inline">rishika</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`group relative flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-sm font-semibold transition-colors ${
                  isActive(l.href)
                    ? "text-ink"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                <span className="hover-wiggle text-base">{l.icon}</span>
                {l.label}
                {isActive(l.href) && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-lavender/70"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-full bg-lavender/60 px-3 py-1.5 text-xl md:hidden"
          aria-label="Toggle menu"
        >
          {open ? "✦" : "☰"}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <motion.ul
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-2 flex max-w-5xl flex-col gap-1 rounded-3xl p-3 soft-card md:hidden"
        >
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 font-body font-semibold ${
                  isActive(l.href)
                    ? "bg-lavender/70 text-ink"
                    : "text-ink-soft"
                }`}
              >
                <span className="text-lg">{l.icon}</span>
                {l.label}
              </Link>
            </li>
          ))}
        </motion.ul>
      )}
    </header>
  );
}
