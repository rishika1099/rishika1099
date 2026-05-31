"use client";

import { motion } from "framer-motion";

type Bloom = {
  e: string;
  d: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
};

const blooms: Bloom[] = [
  { e: "🌸", top: "-10%", left: "12%", d: 5 },
  { e: "🌷", top: "0%", right: "-8%", d: 6 },
  { e: "🌼", bottom: "-6%", right: "14%", d: 5.5 },
  { e: "🌺", bottom: "6%", left: "-8%", d: 6.5 },
];

export default function FlowerPortrait() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
      className="relative mx-auto h-40 w-40 sm:h-48 sm:w-48"
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
          style={{ top: f.top, left: f.left, right: f.right, bottom: f.bottom }}
          animate={{ y: [0, -5, 0], rotate: [-8, 8, -8] }}
          transition={{ repeat: Infinity, duration: f.d, ease: "easeInOut", delay: i * 0.3 }}
          className="absolute text-2xl drop-shadow-sm sm:text-3xl"
        >
          {f.e}
        </motion.span>
      ))}
    </motion.div>
  );
}
