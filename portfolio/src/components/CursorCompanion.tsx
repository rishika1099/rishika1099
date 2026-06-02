"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// A tiny butterfly that lags gently behind the cursor. Pointer-events-none so it
// never blocks anything; hidden on touch devices and when reduced motion is set.
export default function CursorCompanion() {
  const [enabled, setEnabled] = useState(false);
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 90, damping: 16, mass: 0.7 });
  const sy = useSpring(y, { stiffness: 90, damping: 16, mass: 0.7 });

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduced) return;
    setEnabled(true);

    const move = (e: PointerEvent) => {
      // trail a little up and to the left of the cursor
      x.set(e.clientX - 18);
      y.set(e.clientY - 22);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed left-0 top-0 z-[55] hidden -translate-x-1/2 -translate-y-1/2 select-none md:block"
    >
      <motion.span
        className="block text-lg"
        animate={{ rotate: [-12, 12, -12], y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
      >
        🦋
      </motion.span>
    </motion.div>
  );
}
