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
  | "aurora"
  | "midnight"
  | "honey"
  | "koi"
  | "rainbow";

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
  // deep navy night for the private stats room (distinct from the poems' twilight)
  midnight: "from-[#0b1020] via-[#101830] to-[#1a2440]",
  // deep amber workshop light, noticeably warmer than peach
  honey: "from-[#f3cd74] via-[#fbe9c8] to-[#f0b48a]",
  // a calm koi pond seen from above: light shallows to deeper teal-green water
  koi: "from-[#d7efe9] via-[#a9dcd4] to-[#77bcb2]",
  // the atelier edits every page, so it wears every page's color (inline below,
  // a pastel rainbow needs more stops than from/via/to)
  rainbow: "",
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

function Koi({
  top,
  start,
  duration,
  scale = 1,
  emoji = "🐟",
}: {
  top: string;
  start: number;
  duration: number;
  scale?: number;
  emoji?: string;
}) {
  // outer element drifts left->right; the inner span flips the (left-facing)
  // fish so it faces its direction of travel. keeping them separate stops the
  // drift animation's transform from clobbering the flip.
  return (
    <div
      className="pointer-events-none absolute left-0"
      style={{ top, animation: `drift ${duration}s linear infinite`, animationDelay: `-${start}s` }}
    >
      <span
        className="block text-4xl sm:text-5xl"
        style={{ opacity: 0.9, transform: `scaleX(-1) scale(${scale})` }}
      >
        {emoji}
      </span>
    </div>
  );
}

function Bubble({
  left,
  size,
  duration,
  delay,
}: {
  left: string;
  size: number;
  duration: number;
  delay: number;
}) {
  return (
    <span
      className="pointer-events-none absolute rounded-full bg-white/50 ring-1 ring-white/70"
      style={{
        left,
        bottom: "-24px",
        width: size,
        height: size,
        animation: `bubble ${duration}s ease-in infinite`,
        animationDelay: `-${delay}s`,
      }}
    />
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
  const isNight = vibe === "twilight" || vibe === "midnight";
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div
        className={`absolute inset-0 bg-gradient-to-b ${gradients[vibe]}`}
        style={
          vibe === "rainbow"
            ? {
                backgroundImage:
                  "linear-gradient(to bottom, #f7b7c9, #f6d99b 22%, #fdf3cf 40%, #cdeac0 58%, #cfe8f3 78%, #e6d7f5)",
              }
            : undefined
        }
      />

      {/* soft sun / moon glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ duration: 1.6 }}
        className={`absolute right-[8%] top-[8%] h-40 w-40 rounded-full blur-2xl ${
          isNight ? "bg-gold/40" : "bg-white/70"
        }`}
      />

      {!isNight && vibe !== "koi" && (
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

      {/* a koi pond: lily pads floating, koi drifting across, bubbles rising */}
      {vibe === "koi" && (
        <>
          <Koi top="24%" start={0} duration={46} scale={1} emoji="🐟" />
          <Koi top="54%" start={16} duration={54} scale={1.25} emoji="🐠" />
          <Koi top="72%" start={32} duration={62} scale={0.85} emoji="🐟" />
          <Koi top="38%" start={40} duration={50} scale={0.7} emoji="🐠" />
          <span className="pointer-events-none absolute text-5xl" style={{ left: "10%", top: "16%" }}>🪷</span>
          <span className="pointer-events-none absolute text-4xl" style={{ right: "12%", top: "30%" }}>🪷</span>
          <span className="pointer-events-none absolute text-6xl" style={{ left: "64%", top: "60%" }}>🪷</span>
          <span className="pointer-events-none absolute text-3xl" style={{ left: "26%", top: "78%" }}>🍃</span>
          <Bubble left="18%" size={9} duration={9} delay={0} />
          <Bubble left="34%" size={6} duration={11} delay={3} />
          <Bubble left="52%" size={12} duration={8} delay={5} />
          <Bubble left="71%" size={7} duration={10} delay={1.5} />
          <Bubble left="85%" size={9} duration={12} delay={6} />
          <Bubble left="45%" size={5} duration={13} delay={8} />
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
