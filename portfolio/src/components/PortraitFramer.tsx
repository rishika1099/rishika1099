"use client";

import { useRef, useState } from "react";
import { frameStyle, type Frame } from "@/lib/frame";

/**
 * Drag the portrait to choose what its circle shows, slide to zoom. The same
 * controls as the photography gallery's framing, on a round window, because
 * the portrait's window is round.
 *
 * Nothing is cropped away: the whole photo stays stored and only the framing
 * is saved, so it can be changed again at any time without uploading again.
 */
export default function PortraitFramer({
  src = "/portrait",
  frame,
  onChange,
  onSave,
  onClose,
}: {
  src?: string;
  frame: Frame | null;
  /** every move, for a page that wants to show it on the real portrait as it happens */
  onChange?: (f: Frame) => void;
  /** null puts it back to the centre */
  onSave: (f: Frame | null) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState<Frame>(frame ?? { x: 50, y: 50, zoom: 1 });
  // Pointer moves arrive faster than renders. Reading the framing from here,
  // not from the last render, keeps a quick drag from dropping the moves in
  // between.
  const latest = useRef(f);
  const drag = useRef<{ px: number; py: number } | null>(null);
  const SIZE = 176;

  const set = (next: Frame) => {
    latest.current = next;
    setF(next);
    onChange?.(next);
  };

  return (
    <div className="rounded-2xl bg-white/90 p-3 text-left shadow-lg backdrop-blur">
      <p className="font-body text-xs font-semibold text-ink-soft">
        🎯 drag the photo to frame it, slide to zoom
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <div
          style={{ width: SIZE, height: SIZE }}
          className="relative shrink-0 cursor-grab touch-none overflow-hidden rounded-full border-4 border-white bg-white shadow active:cursor-grabbing"
          onPointerDown={(e) => {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            drag.current = { px: e.clientX, py: e.clientY };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const dx = e.clientX - drag.current.px;
            const dy = e.clientY - drag.current.py;
            drag.current = { px: e.clientX, py: e.clientY };
            // a zoomed photo moves further under the same drag, so the pull is scaled to match the hand
            const now = latest.current;
            set({
              ...now,
              x: Math.max(0, Math.min(100, now.x - ((dx / SIZE) * 100) / now.zoom)),
              y: Math.max(0, Math.min(100, now.y - ((dy / SIZE) * 100) / now.zoom)),
            });
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="framing preview"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
            style={frameStyle(f)}
          />
        </div>
        <div className="min-w-40 flex-1 space-y-3">
          <label className="block font-body text-xs text-ink-soft">
            zoom · {f.zoom.toFixed(2)}x
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={f.zoom}
              onChange={(e) => set({ ...latest.current, zoom: Number(e.target.value) })}
              className="mt-1 w-full accent-[#c77dba]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full bg-ink px-4 py-1.5 font-body text-xs font-semibold text-cream transition hover:opacity-90"
              onClick={() => onSave(f)}
            >
              save framing
            </button>
            <button
              type="button"
              className="rounded-full bg-white px-4 py-1.5 font-body text-xs font-semibold text-ink-soft ring-1 ring-ink/10 transition hover:bg-cream"
              onClick={() => onSave(null)}
            >
              reset to center
            </button>
            <button
              type="button"
              className="rounded-full px-3 py-1.5 font-body text-xs font-semibold text-ink-soft transition hover:text-ink"
              onClick={onClose}
            >
              cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
