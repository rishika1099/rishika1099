"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import type { Poem } from "@/lib/poems-store";
import { moodColor } from "@/lib/moods";
import ReactionBar from "@/components/ReactionBar";
import AmbientSound from "@/components/AmbientSound";

function CardArt({ poem }: { poem: Poem }) {
  const [broken, setBroken] = useState(false);
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
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-lavender/40 to-twilight-soft/60">
      <span className="animate-float-med text-5xl opacity-80">🕯️</span>
    </div>
  );
}

function MoodChip({ mood }: { mood?: string }) {
  if (!mood) return null;
  return (
    <span
      style={{ backgroundColor: moodColor[mood] ?? "#8794b8" }}
      className="inline-block rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold text-white"
    >
      {mood}
    </span>
  );
}

export default function PoemRoom({ poems }: { poems: Poem[] }) {
  const [active, setActive] = useState<Poem | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // moods present, in palette order of first appearance
  const moods = Array.from(new Set(poems.map((p) => p.mood).filter(Boolean))) as string[];
  const shown = filter === "all" ? poems : poems.filter((p) => p.mood === filter);

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
      <AmbientSound />
      {moods.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3.5 py-1 font-body text-sm font-semibold transition ${
              filter === "all" ? "bg-cream text-ink" : "bg-white/10 text-cream/80 hover:bg-white/20"
            }`}
          >
            all moods
          </button>
          {moods.map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              style={filter === m ? { backgroundColor: moodColor[m] } : undefined}
              className={`rounded-full px-3.5 py-1 font-body text-sm font-semibold transition ${
                filter === m ? "text-white" : "bg-white/10 text-cream/80 hover:bg-white/20"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((poem, i) => (
            <motion.button
              layout
              key={poem.slug}
              type="button"
              onClick={() => setActive(poem)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.03 * i }}
              whileHover={{ y: -6, rotate: i % 2 ? 1.5 : -1.5 }}
              className="group flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/5 text-left backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blush/60"
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <CardArt poem={poem} />
                {poem.pinned && (
                  <span
                    className="absolute right-2 top-2 rounded-full bg-ink/60 px-2 py-0.5 font-body text-[10px] font-semibold text-cream backdrop-blur-sm"
                    title="pinned"
                  >
                    📌
                  </span>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-display text-base font-semibold leading-snug text-cream sm:text-lg">
                  {poem.title}
                </h2>
                {poem.mood && (
                  <div className="mt-2">
                    <MoodChip mood={poem.mood} />
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#0b0b0e]/80 p-4 backdrop-blur-sm sm:p-8"
          >
            <motion.article
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="relative my-auto w-full max-w-2xl rounded-[2rem] border border-white/10 bg-[#1c1c24]/98 p-7 shadow-2xl sm:p-10"
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

              <h2 className="font-display text-3xl font-semibold text-cream">{active.title}</h2>
              {active.mood && (
                <div className="mt-2">
                  <MoodChip mood={active.mood} />
                </div>
              )}
              {active.rich ? (
                <div
                  className="prose-poem mt-5 font-serif text-lg leading-relaxed text-cream/90"
                  // sanitized at save time in the atelier; only the key-holder writes it
                  dangerouslySetInnerHTML={{ __html: active.content }}
                />
              ) : (
                <div className="prose-poem mt-5 whitespace-pre-line font-serif text-lg leading-relaxed text-cream/90">
                  <ReactMarkdown>{active.content}</ReactMarkdown>
                </div>
              )}
              <div className="mt-7 border-t border-white/10 pt-5">
                <ReactionBar id={`poem:${active.slug}`} dark />
              </div>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
