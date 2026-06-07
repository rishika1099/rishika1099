"use client";

import { motion } from "framer-motion";

const flowers = ["🌸", "🌻", "🌷", "🌼", "🌹", "🌺", "🪻", "🪷"];
const R = 52; // ring radius (% from center), so blooms hug the frame rim

// evenly spaced around the circle, starting at the top
const blooms = flowers.map((e, i) => {
  const angle = -Math.PI / 2 + (i / flowers.length) * Math.PI * 2;
  return {
    e,
    left: 50 + R * Math.cos(angle),
    top: 50 + R * Math.sin(angle),
    d: 5 + (i % 4) * 0.5,
  };
});

export default function FlowerPortrait() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
      className="relative mx-auto h-52 w-52 sm:h-64 sm:w-64"
    >
      {/* soft pastel glow behind the photo */}
      <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-blush/60 to-lavender/60 blur-lg" />
      <motion.img
        src="https://github.com/rishika1099.png"
        alt="Rishika"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        className="relative h-full w-full rounded-full border-4 border-white object-cover shadow-lg"
      />
      {blooms.map((f, i) => (
        <motion.span
          key={i}
          aria-hidden
          style={{ left: `${f.left}%`, top: `${f.top}%` }}
          animate={{ y: [0, -5, 0], rotate: [-8, 8, -8] }}
          transition={{ repeat: Infinity, duration: f.d, ease: "easeInOut", delay: i * 0.3 }}
          className="absolute -translate-x-1/2 -translate-y-1/2 text-[0.9rem] drop-shadow-sm sm:text-[1.2rem]"
        >
          {f.e}
        </motion.span>
      ))}
    </motion.div>
  );
}
