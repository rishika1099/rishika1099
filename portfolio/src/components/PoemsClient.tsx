"use client";

import { useState } from "react";
import type { Poem } from "@/lib/poems-store";
import PoemGate from "@/components/PoemGate";
import PoemRoom from "@/components/PoemRoom";

// Gate state lives in memory only, so a refresh always starts locked. The
// unlock cookie (set by /api/unlock) just authorizes the art images and the
// /api/poems fetch during the session.
export default function PoemsClient() {
  const [poems, setPoems] = useState<Poem[] | null>(null); // null = locked

  async function loadPoems() {
    try {
      const res = await fetch("/api/poems");
      if (res.ok) {
        const data = (await res.json()) as { poems?: Poem[] };
        setPoems(data.poems ?? []);
      }
    } catch {
      /* stay locked on error */
    }
  }

  async function lock() {
    await fetch("/api/lock", { method: "POST" });
    setPoems(null);
  }

  if (poems === null) {
    return <PoemGate onUnlocked={loadPoems} />;
  }

  const conf = poems
    .map((p) => p.moodConfidence)
    .filter((c): c is number => typeof c === "number");
  const avgConf = conf.length ? conf.reduce((s, c) => s + c, 0) / conf.length : null;

  return (
    <>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-body text-lg text-lavender">
          welcome in, make yourself a cup of something warm
        </p>
        <button
          onClick={lock}
          className="rounded-full bg-white/70 px-4 py-1.5 font-body text-sm font-semibold text-ink-soft transition hover:bg-white"
        >
          🔒 lock the room again
        </button>
      </div>

      <PoemRoom poems={poems} />

      {avgConf !== null && (
        <p className="mt-6 font-body text-xs text-lavender/60">
          moods inferred by a language model · avg confidence {avgConf.toFixed(2)} ✦
        </p>
      )}

      <p className="mt-14 text-center font-body text-xs text-lavender/70">
        <span className="mr-1.5">©</span>
        {new Date().getFullYear()}{" "}
        Rishika Mamidibathula. These poems are my own work, shared here with love. Please
        don&apos;t reproduce or repost them without permission. ✦
      </p>
    </>
  );
}
