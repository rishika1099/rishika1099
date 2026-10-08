"use client";

import { useEffect, useSyncExternalStore } from "react";
import { m, useMotionValue, useSpring } from "framer-motion";

// A tiny butterfly that lags gently behind the cursor. Pointer-events-none so it
// never blocks anything; hidden on touch devices and when reduced motion is set.
// Whether this device gets the butterfly: a real pointer, and no request for
// less motion. Read from the browser rather than copied into state, and false
// on the server, so the first render matches on both sides.
const QUERIES = ["(pointer: fine)", "(prefers-reduced-motion: reduce)"];
function watch(onChange: () => void) {
  const lists = QUERIES.map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener("change", onChange));
  return () => lists.forEach((l) => l.removeEventListener("change", onChange));
}
const wanted = () =>
  window.matchMedia(QUERIES[0]).matches && !window.matchMedia(QUERIES[1]).matches;

export default function CursorCompanion() {
  const enabled = useSyncExternalStore(watch, wanted, () => false);
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 90, damping: 16, mass: 0.7 });
  const sy = useSpring(y, { stiffness: 90, damping: 16, mass: 0.7 });

  useEffect(() => {
    if (!enabled) return;

    const move = (e: PointerEvent) => {
      // trail a little up and to the left of the cursor
      x.set(e.clientX - 18);
      y.set(e.clientY - 22);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <m.div
      aria-hidden
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed left-0 top-0 z-[55] hidden -translate-x-1/2 -translate-y-1/2 select-none md:block"
    >
      <m.span
        className="block text-lg"
        animate={{ rotate: [-12, 12, -12], y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
      >
        🦋
      </m.span>
    </m.div>
  );
}
