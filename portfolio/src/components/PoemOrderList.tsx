"use client";

// Drag-and-drop poem list shared by the atelier's poems tab (light) and the
// poem desk at /blog/poems/edit (dark twilight). Dragging rearranges, 📌 pins
// to the top; both persist to the poems order sidecar in one call.

import { useEffect, useRef } from "react";
import { Reorder } from "framer-motion";

export interface OrderablePoem {
  slug: string;
  title: string;
  date: string;
  pinned?: boolean;
}

export default function PoemOrderList<T extends OrderablePoem>({
  poems,
  setPoems,
  persist,
  onEdit,
  dark = false,
}: {
  poems: T[];
  setPoems: (l: T[]) => void;
  /** save (order, pinned) slugs; both live in the same sidecar */
  persist: (order: string[], pinned: string[]) => void;
  onEdit: (p: T) => void;
  dark?: boolean;
}) {
  // ref mirror so drag-end persists the freshest order
  const ref = useRef(poems);
  useEffect(() => {
    ref.current = poems;
  }, [poems]);

  const save = () => {
    const cur = ref.current;
    persist(cur.map((p) => p.slug), cur.filter((p) => p.pinned).map((p) => p.slug));
  };

  const togglePin = (slug: string) => {
    // flip the pin, then float pinned to the top (stable sort keeps the rest)
    const next = ref.current
      .map((p) => (p.slug === slug ? { ...p, pinned: !p.pinned } : p))
      .sort((a, b) => (!!a.pinned === !!b.pinned ? 0 : a.pinned ? -1 : 1));
    ref.current = next;
    setPoems(next);
    save();
  };

  const row = dark
    ? "border border-white/10 bg-white/5"
    : "bg-white/50";
  const rowPinned = dark
    ? "border border-gold/50 bg-gold/15"
    : "bg-gold/30 ring-1 ring-gold/60";
  const titleCls = dark ? "text-cream" : "text-ink";
  const subCls = dark ? "text-cream/60" : "text-ink-soft";
  const btn = `rounded-full px-4 py-1.5 font-body text-sm font-semibold transition ${
    dark ? "bg-white/15 text-cream hover:bg-white/25" : "bg-white/70 text-ink-soft hover:bg-white"
  }`;

  return (
    <>
      <p className={`mt-4 font-body text-xs ${dark ? "text-cream/50" : "text-ink-soft/70"}`}>
        drag to reorder, 📌 to pin to the top of the poem room ✦
      </p>
      <Reorder.Group axis="y" values={poems} onReorder={setPoems} as="ul" className="mt-2 space-y-2">
        {poems.map((p) => (
          <Reorder.Item
            key={p.slug}
            value={p}
            as="li"
            onDragEnd={save}
            className={`flex cursor-grab items-center justify-between gap-3 rounded-2xl p-4 active:cursor-grabbing ${
              p.pinned ? rowPinned : row
            }`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span aria-hidden className={`select-none ${dark ? "text-cream/40" : "text-ink-soft/50"}`} title="drag to reorder">
                ⠿
              </span>
              <div className="min-w-0">
                <p className={`flex items-center gap-1.5 font-body text-sm font-bold ${titleCls}`}>
                  <span className="truncate">{p.title}</span>
                  {p.pinned && <span aria-hidden>📌</span>}
                </p>
                <p className={`font-body text-xs italic ${subCls}`}>{p.date}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                className={btn}
                title={p.pinned ? "unpin from the top" : "pin to the top"}
                onClick={() => togglePin(p.slug)}
              >
                {p.pinned ? "📌 unpin" : "📌 pin"}
              </button>
              <button type="button" className={btn} onClick={() => onEdit(p)}>
                ✎ edit
              </button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </>
  );
}
