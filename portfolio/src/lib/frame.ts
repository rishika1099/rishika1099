// How a picture sits inside the window that shows it: which point of it is
// held at the centre, and how far it is zoomed in. The same idea as the
// photography gallery's framing, shared here so the portrait can use it.

import type { CSSProperties } from "react";

export interface Frame {
  x: number; // 0..100, left to right
  y: number; // 0..100, top to bottom
  zoom: number; // 1..3
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** A frame from anything that claims to be one, or null if it is not. */
export function cleanFrame(v: unknown): Frame | null {
  if (!v || typeof v !== "object") return null;
  const { x, y, zoom } = v as Record<string, unknown>;
  if (![x, y, zoom].every((n) => typeof n === "number" && Number.isFinite(n))) return null;
  return {
    x: clamp(x as number, 0, 100),
    y: clamp(y as number, 0, 100),
    zoom: clamp(zoom as number, 1, 3),
  };
}

/** The styles that put an object-cover image in this frame. */
export function frameStyle(frame?: Frame | null): CSSProperties {
  if (!frame) return {};
  return {
    objectPosition: `${frame.x}% ${frame.y}%`,
    transform: frame.zoom !== 1 ? `scale(${frame.zoom})` : undefined,
    transformOrigin: `${frame.x}% ${frame.y}%`,
  };
}
