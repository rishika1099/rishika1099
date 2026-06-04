"use client";

import { motion } from "framer-motion";

export type Vibe =
  | "dawn"
  | "lilac"
  | "azure"
  | "meadow"
  | "peach"
  | "sunset"
  | "rose"
  | "twilight"
  | "aurora";

// A soft-pastel arc from sunrise blues through golden hour to a sunset rose,
// one distinct gradient per page (twilight stays dark for the poem room).
const gradients: Record<Vibe, string> = {
  dawn: "from-sky via-lavender/60 to-dawn",
  lilac: "from-lavender via-petal/40 to-sky/50",
  azure: "from-sky via-cream to-mint/50",
  meadow: "from-mint via-cream to-meadow",
  peach: "from-gold/60 via-cream to-dawn",
  sunset: "from-sunset via-blush/50 to-lavender",
  rose: "from-rose via-blush/50 to-gold/40",
  twilight: "from-[#0f0f13] via-[#17171d] to-[#23232b]",
  // distinct cool aurora for the feature-tour article (mint -> sky -> lavender)
  aurora: "from-mint via-sky/60 to-lavender",
};

function Cloud({
  top,
  start,
  duration,
  scale = 1,
  opacity = 0.85,
}: {
  top: string;
  start: number; // seconds already elapsed at load (negative delay) so it drifts immediately
  duration: number;
  scale?: number;
  opacity?: number;
}) {
  return (
    <div
      className="pointer-events-none absolute left-0 text-6xl sm:text-7xl"
      style={{
        top,
        opacity,
        transform: `scale(${scale})`,
        animation: `drift ${duration}s linear infinite`,
        animationDelay: `-${start}s`,
      }}
    >
      ☁️
    </div>
  );
}

function Sparkle({ left, top, delay }: { left: string; top: string; delay: number }) {
  return (
    <span
      className="animate-twinkle pointer-events-none absolute text-sm"
      style={{ left, top, animationDelay: `${delay}s` }}
    >
      ✦
    </span>
  );
}

const sparkles = [
  { left: "12%", top: "18%", delay: 0 },
  { left: "78%", top: "12%", delay: 0.8 },
  { left: "44%", top: "26%", delay: 1.6 },
  { left: "88%", top: "40%", delay: 0.4 },
  { left: "22%", top: "62%", delay: 1.1 },
  { left: "66%", top: "70%", delay: 2 },
  { left: "8%", top: "80%", delay: 1.4 },
  { left: "55%", top: "8%", delay: 2.4 },
];

export default function Scenery({ vibe }: { vibe: Vibe }) {
  const isNight = vibe === "twilight";
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-b ${gradients[vibe]}`} />

      {/* soft sun / moon glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 1.6 }}
        className={`absolute right-[8%] top-[8%] h-40 w-40 rounded-full blur-2xl ${
          isNight ? "bg-gold/40" : "bg-white/70"
        }`}
      />

      {!isNight && (
        <>
          {/* same duration + evenly spaced starts (0, 15, 30, 45 of a 60s loop)
              keeps horizontal spacing even; heights are scrambled (not increasing
              with the phase) so the clouds zig-zag instead of forming a diagonal */}
          <Cloud top="48%" start={0} duration={60} scale={1} opacity={0.8} />
          <Cloud top="14%" start={15} duration={60} scale={0.7} opacity={0.6} />
          <Cloud top="66%" start={30} duration={60} scale={1.2} opacity={0.62} />
          <Cloud top="28%" start={45} duration={60} scale={0.9} opacity={0.55} />
        </>
      )}

      {vibe === "meadow" && (
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-meadow to-transparent" />
      )}

      {sparkles.map((s, i) => (
        <Sparkle key={i} {...s} />
      ))}

      {isNight &&
        Array.from({ length: 28 }).map((_, i) => (
          <span
            key={`star-${i}`}
            className="animate-twinkle absolute h-1 w-1 rounded-full bg-white"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 90}%`,
              animationDelay: `${(i % 5) * 0.6}s`,
            }}
          />
        ))}
    </div>
  );
}
