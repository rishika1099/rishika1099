"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Horizontal shelf for one area. Arrows because a mouse has no sideways scroll,
 * and it advances a card at a time on its own, the way a phone carousel does.
 *
 * The advance yields to the reader: it stops while hovered, focused, or touched,
 * while the shelf is off-screen, for a few seconds after any manual scroll, and
 * entirely when the visitor prefers reduced m.
 */
export function Carousel({
  children,
  label = "item",
  fitHeight = false,
}: {
  children: React.ReactNode;
  /** what the dots announce, e.g. "project" or "certification" */
  label?: string;
  /**
   * Let each card end where its content ends, instead of stretching every card
   * to match the tallest. A single card with an attachment was adding ~100px of
   * empty space to the bottom of every card beside it. Project shelves hold
   * evenly-sized cards and still look better squared off, so this is opt-in.
   */
  fitHeight?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [count, setCount] = useState(0);
  const nudge = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * cardStep(el), behavior: "smooth" });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let onScreen = false;
    const io = new IntersectionObserver((es) => (onScreen = es[0]?.isIntersecting ?? false), {
      threshold: 0.3,
    });
    io.observe(el);

    // native listeners rather than React's synthetic enter/leave, which are
    // derived from mouseover and easy to miss on a scrolling container
    let held = false;
    const hold = () => (held = true);
    const release = () => (held = false);
    let quietUntil = 0;
    const hush = () => (quietUntil = Date.now() + 6000);
    // scrolling the page with the cursor over a shelf fires wheel here too;
    // only a sideways gesture means the reader is actually driving this shelf
    const maybeHush = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) hush();
    };
    el.addEventListener("pointerenter", hold);
    el.addEventListener("pointerleave", release);
    el.addEventListener("focusin", hold);
    el.addEventListener("focusout", release);
    el.addEventListener("wheel", maybeHush, { passive: true });
    el.addEventListener("pointerdown", hush);
    el.addEventListener("touchstart", hush, { passive: true });

    // keep the dots in step with wherever the shelf actually is, however it got
    // there: an advance, an arrow, a swipe, or a dot
    const sync = () => {
      setCount(el.querySelectorAll("[data-carousel-item]").length);
      setAt(Math.round(el.scrollLeft / cardStep(el)));
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });

    const id = setInterval(() => {
      if (!onScreen || held || Date.now() < quietUntil) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max < 4) return;
      if (el.scrollLeft >= max - 4) el.scrollTo({ left: 0, behavior: "smooth" });
      else el.scrollBy({ left: cardStep(el), behavior: "smooth" });
    }, 3800);

    return () => {
      clearInterval(id);
      io.disconnect();
      el.removeEventListener("scroll", sync);
      el.removeEventListener("pointerenter", hold);
      el.removeEventListener("pointerleave", release);
      el.removeEventListener("focusin", hold);
      el.removeEventListener("focusout", release);
      el.removeEventListener("wheel", maybeHush);
      el.removeEventListener("pointerdown", hush);
      el.removeEventListener("touchstart", hush);
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={ref}
        className={`flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          fitHeight ? "items-start" : ""
        }`}
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="scroll left"
        onClick={() => nudge(-1)}
        className="absolute -left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink-soft shadow-md transition hover:text-ink lg:block"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="scroll right"
        onClick={() => nudge(1)}
        className="absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink-soft shadow-md transition hover:text-ink lg:block"
      >
        ›
      </button>

      {count > 1 && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`go to ${label} ${i + 1} of ${count}`}
              aria-current={i === at ? "true" : undefined}
              onClick={() => {
                const el = ref.current;
                if (el) el.scrollTo({ left: i * cardStep(el), behavior: "smooth" });
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === at ? "w-5 bg-ink/70" : "w-1.5 bg-ink/20 hover:bg-ink/40"
              }`}
            />
          ))}
          <span className="ml-2 font-body text-xs text-ink-soft/70">
            {Math.min(at + 1, count)} / {count}
          </span>
        </div>
      )}
    </div>
  );
}

/** One card plus the flex gap, so a step lands cleanly on the next card. */
export function cardStep(el: HTMLElement): number {
  const card = el.querySelector("[data-carousel-item]");
  return card ? card.getBoundingClientRect().width + 16 : Math.max(300, el.clientWidth * 0.8);
}

