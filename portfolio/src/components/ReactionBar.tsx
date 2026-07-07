"use client";

// Aggregate heart / sparkle reactions, no login. Each browser can toggle one of
// each per item (remembered in localStorage), and the counts are shared.

import { useEffect, useState } from "react";

type Counts = { heart: number; sparkle: number };
type Kind = keyof Counts;

const REACTIONS: { kind: Kind; emoji: string; label: string }[] = [
  { kind: "heart", emoji: "💗", label: "love this" },
  { kind: "sparkle", emoji: "✨", label: "this sparkles" },
];

const storeKey = "reacted";
function readMine(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(storeKey) ?? "{}");
  } catch {
    return {};
  }
}
function writeMine(m: Record<string, boolean>) {
  try {
    localStorage.setItem(storeKey, JSON.stringify(m));
  } catch {
    // storage blocked: reactions just won't be remembered
  }
}

export default function ReactionBar({ id, dark = false }: { id: string; dark?: boolean }) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [mine, setMine] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMine(readMine());
    fetch(`/api/react?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then(setCounts)
      .catch(() => setCounts({ heart: 0, sparkle: 0 }));
  }, [id]);

  function toggle(kind: Kind) {
    const key = `${id}:${kind}`;
    const active = !!mine[key];
    const delta = active ? -1 : 1;
    // optimistic update
    setCounts((c) => (c ? { ...c, [kind]: Math.max(0, c[kind] + delta) } : c));
    const nextMine = { ...mine, [key]: !active };
    if (active) delete nextMine[key];
    setMine(nextMine);
    writeMine(nextMine);
    fetch("/api/react", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, kind, delta }),
    })
      .then((r) => r.json())
      .then((c) => c && typeof c.heart === "number" && setCounts(c))
      .catch(() => {});
  }

  const base = dark
    ? "bg-white/10 text-cream/90 hover:bg-white/20"
    : "bg-white/70 text-ink-soft hover:bg-white";
  const on = dark ? "bg-blush/40 text-cream" : "bg-blush/50 text-ink";

  return (
    <div className="flex items-center gap-2">
      {REACTIONS.map(({ kind, emoji, label }) => {
        const active = !!mine[`${id}:${kind}`];
        return (
          <button
            key={kind}
            type="button"
            title={label}
            onClick={() => toggle(kind)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-body text-sm font-semibold transition hover:scale-105 ${
              active ? on : base
            }`}
          >
            <span className={active ? "" : "opacity-80"}>{emoji}</span>
            <span className="tabular-nums">{counts ? counts[kind] : "·"}</span>
          </button>
        );
      })}
    </div>
  );
}
