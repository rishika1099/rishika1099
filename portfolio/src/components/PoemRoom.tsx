"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import type { Doc } from "@/lib/content";

function CardArt({ poem }: { poem: Doc }) {
  const [broken, setBroken] = useState(false);
  // Art is generated + cached on demand by /api/poem-art/[slug] (gated by the
  // same unlock cookie). First view triggers generation; after that it's cached.
  if (!broken) {
    return (
      <Image
        src={`/api/poem-art/${poem.slug}`}
        alt={poem.title}
        fill
        unoptimized
        sizes="(max-width: 640px) 50vw, 300px"
        className="object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
        onError={() => setBroken(true)}
      />
    );
  }
  // graceful placeholder while art is being conjured (or if the key is unset)
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-lavender/40 to-twilight-soft/60">
      <span className="animate-float-med text-5xl opacity-80">🕯️</span>
    </div>
  );
}

export default function PoemRoom({ poems }: { poems: Doc[] }) {
  const [active, setActive] = useState<Doc | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = active ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3">
        {poems.map((poem, i) => (
          <motion.button
            key={poem.slug}
            type="button"
            onClick={() => setActive(poem)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ y: -6, rotate: i % 2 ? 1.5 : -1.5 }}
            className="group flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/5 text-left backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blush/60"
          >
            <div className="relative aspect-square w-full overflow-hidden">
              <CardArt poem={poem} />
            </div>
            <div className="p-4">
              <h2 className="font-display text-base font-semibold leading-snug text-cream sm:text-lg">
                {poem.title}
              </h2>
              {poem.date && (
                <p className="mt-0.5 font-hand text-sm text-lavender/80">
                  {poem.date}
                </p>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-twilight/70 p-4 backdrop-blur-sm sm:p-8"
          >
            <motion.article
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="relative my-auto w-full max-w-2xl rounded-[2rem] border border-white/15 bg-twilight-soft/95 p-7 shadow-2xl sm:p-10"
            >
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label="close"
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 font-display text-lg text-cream transition hover:bg-white/20"
              >
                ✕
              </button>

              <div className="relative mx-auto mb-6 aspect-square w-40 overflow-hidden rounded-2xl">
                <CardArt poem={active} />
              </div>

              <h2 className="font-display text-3xl font-semibold text-cream">
                {active.title}
              </h2>
              {active.date && (
                <p className="mt-1 font-hand text-lg text-lavender/80">
                  {active.date}
                </p>
              )}
              <div className="prose-poem mt-5 whitespace-pre-line font-serif text-lg leading-relaxed text-cream/90">
                <ReactMarkdown>{active.content}</ReactMarkdown>
              </div>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
