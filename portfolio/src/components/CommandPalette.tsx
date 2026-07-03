"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { projects } from "@/data/projects";

interface Item {
  label: string;
  hint: string;
  href: string;
  external?: boolean;
}

const PAGES: Item[] = [
  { label: "Home", hint: "page", href: "/" },
  { label: "About", hint: "page", href: "/about" },
  { label: "Work", hint: "page", href: "/work" },
  { label: "Writing room", hint: "page", href: "/blog" },
  { label: "Technical blogs", hint: "page", href: "/blog/technical" },
  { label: "Poems", hint: "page", href: "/blog/poems" },
  { label: "Photography", hint: "page", href: "/blog/photography" },
  { label: "Contact", hint: "page", href: "/contact" },
  { label: "Feature tour", hint: "page", href: "/blog/technical/under-the-hood" },
  { label: "Now", hint: "page", href: "/now" },
  { label: "Resume (PDF)", hint: "resume", href: "/Rishika_Resume.pdf", external: true },
];

const PROJECT_ITEMS: Item[] = projects.map((p) => ({
  label: p.name,
  hint: "project",
  href: p.demo ?? p.repo,
  external: true,
}));

const ALL = [...PAGES, ...PROJECT_ITEMS];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL;
    return ALL.filter((i) => i.label.toLowerCase().includes(q));
  }, [query]);

  // global Cmd/Ctrl+K to open, Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function go(item: Item) {
    setOpen(false);
    if (item.external) window.open(item.href, "_blank", "noreferrer");
    else router.push(item.href);
  }

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[70] flex items-start justify-center bg-[#2b2a4a]/30 p-4 pt-[12vh] backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/70 bg-cream/98 shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-ink/10 px-4 py-3">
              <span className="text-lg">🔍</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onListKey}
                placeholder="jump to a page or project…"
                aria-label="command palette"
                className="flex-1 bg-transparent font-body text-base text-ink outline-none placeholder:text-ink-soft/60"
              />
              <kbd className="rounded-md bg-lavender/60 px-1.5 py-0.5 font-body text-[10px] font-semibold text-ink">
                esc
              </kbd>
            </div>

            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <li className="px-3 py-6 text-center font-body text-sm text-ink-soft">
                  nothing here ✦
                </li>
              )}
              {results.map((item, i) => (
                <li key={`${item.hint}-${item.label}`}>
                  <button
                    type="button"
                    onClick={() => go(item)}
                    onMouseMove={() => setActive(i)}
                    className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left font-body text-sm transition ${
                      i === active ? "bg-lavender/60 text-ink" : "text-ink-soft"
                    }`}
                  >
                    <span className="font-semibold text-ink">{item.label}</span>
                    <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
                      {item.hint}
                      {item.external ? " ↗" : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
