"use client";

import { useEffect } from "react";
import type { Vibe } from "@/components/Scenery";

/**
 * Publishes the current page's colour so anything rendered outside the page can
 * match it.
 *
 * Dialogs portal to <body>, which is outside the `vibe-*` wrapper, so they
 * cannot inherit the ground they were opened from: left alone they were cream
 * everywhere, which read as a panel borrowed from another site once a page
 * stopped being cream. Rather than passing a colour down through every card
 * that can open something, the page publishes it once on the root element and
 * anything that needs it reads `var(--page-surface)`.
 *
 * A light tint of the vibe rather than the gradient itself: a sheet has to hold
 * body text, so it wants to be paler than the page behind it.
 */
const SURFACES: Record<Vibe, string> = {
  periwinkle: "#eeedfb",
  dawn: "#fff1e8",
  lilac: "#f4eefb",
  azure: "#eef7fb",
  meadow: "#f0f8ee",
  peach: "#fff3e6",
  sunset: "#fff0e9",
  rose: "#fdeef1",
  twilight: "#1b1b22",
  aurora: "#eef7f5",
  midnight: "#141c33",
  honey: "#fdf1dc",
  koi: "#eaf6f3",
  rainbow: "#fdf7fb",
};

/**
 * The same colours a shade stronger, for things that need presence rather than
 * a reading surface: the ask launcher, a selected pill.
 */
const ACCENTS: Record<Vibe, string> = {
  periwinkle: "#c7c4f2",
  dawn: "#ffd0b0",
  lilac: "#d9c2f0",
  azure: "#bfe0f0",
  meadow: "#bfe3b0",
  peach: "#ffd9a8",
  sunset: "#ffc0a0",
  rose: "#f7a8bc",
  twilight: "#d9c2f0",
  aurora: "#c5e8d5",
  midnight: "#c7d3f2",
  honey: "#f5cf8a",
  koi: "#a9dcd4",
  rainbow: "#f3d9ee",
};

/** Ink on a dark sheet has to flip, or it is invisible. */
const DARK: Vibe[] = ["twilight", "midnight"];

export default function VibeSurface({ vibe }: { vibe: Vibe }) {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--page-surface", SURFACES[vibe] ?? "#fff8f0");
    root.style.setProperty("--page-surface-ink", DARK.includes(vibe) ? "#f3eefe" : "#4a4a5e");
    root.style.setProperty("--page-accent", ACCENTS[vibe] ?? "#ffd0b0");
    return () => {
      root.style.removeProperty("--page-surface");
      root.style.removeProperty("--page-surface-ink");
      root.style.removeProperty("--page-accent");
    };
  }, [vibe]);
  return null;
}
