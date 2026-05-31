"use client";

import { motion } from "framer-motion";

export type Vibe = "dawn" | "cozy" | "meadow" | "twilight" | "sunset";

const gradients: Record<Vibe, string> = {
  dawn: "from-sky via-lavender/60 to-dawn",
  cozy: "from-dawn via-cream to-gold/40",
  meadow: "from-mint via-cream to-meadow",
  twilight: "from-[#0f0f13] via-[#17171d] to-[#23232b]",
  sunset: "from-sunset via-blush/50 to-lavender",
};

function Cloud({ top, delay, scale = 1, opacity = 0.85 }: { top: string; delay: number; scale?: number; opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute left-0 text-6xl sm:text-7xl"
      style={{
        top,
        opacity,
        transform: `scale(${scale})`,
        animation: `drift ${38 + delay * 4}s linear ${delay}s infinite`,
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

      {(vibe === "dawn" || vibe === "sunset" || vibe === "cozy") && (
        <>
          <Cloud top="14%" delay={0} scale={1} />
          <Cloud top="36%" delay={6} scale={0.8} opacity={0.7} />
          <Cloud top="60%" delay={3} scale={1.2} opacity={0.6} />
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
