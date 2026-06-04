"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";

const links = [
  { href: "/", label: "Home", icon: "🎀" },
  { href: "/about", label: "About", icon: "🦦" },
  { href: "/work", label: "Work", icon: "🌱" },
  { href: "/blog", label: "Blog", icon: "🎐" },
  { href: "/contact", label: "Contact", icon: "💌" },
];

// each tab's pill echoes the background gradient of the page it leads to
const tabTint: Record<string, string> = {
  "/": "rgba(255, 222, 205, 0.85)", // dawn
  "/about": "rgba(230, 215, 245, 0.85)", // lilac
  "/work": "rgba(214, 238, 214, 0.9)", // meadow
  "/blog": "rgba(255, 226, 206, 0.9)", // peach
  "/contact": "rgba(247, 183, 201, 0.85)", // rose
};

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50">
      <nav className="mx-auto mt-3 flex max-w-5xl items-center justify-between rounded-full px-4 py-2 soft-card sm:px-6">
        <Link href="/" className="flex items-center" aria-label="rishika, home">
          <Image
            src="/rishika-logo.png"
            alt="rishika"
            width={447}
            height={161}
            priority
            className="h-8 w-auto sm:h-9"
          />
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
                    className="absolute inset-0 -z-10 rounded-full"
                    style={{ backgroundColor: tabTint[l.href] ?? "rgba(230, 215, 245, 0.85)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {/* command palette hint */}
          <button
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="hidden items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 font-body text-xs font-semibold text-ink-soft transition hover:bg-white md:inline-flex"
            aria-label="open quick jump"
            title="quick jump to any page or project"
          >
            <span>🔍</span>
            <kbd className="rounded bg-lavender/60 px-1.5 py-0.5 font-body text-[10px] text-ink">⌘K</kbd>
          </button>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-full bg-lavender/60 px-3 py-1.5 text-xl md:hidden"
            aria-label="Toggle menu"
          >
            {open ? "✦" : "☰"}
          </button>
        </div>
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
                style={isActive(l.href) ? { backgroundColor: tabTint[l.href] } : undefined}
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 font-body font-semibold ${
                  isActive(l.href) ? "text-ink" : "text-ink-soft"
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
