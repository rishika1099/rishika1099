"use client";

// Soft ocean ambience for the poem room, played from /ocean.mp3 (looped, with a
// gentle fade in/out). Off by default; a click starts it, which also satisfies
// the browser's autoplay-gesture requirement.

import { useEffect, useRef, useState } from "react";

const TARGET = 0.5; // comfortable loop volume

export default function AmbientSound() {
  const [on, setOn] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);

  function fadeTo(target: number, done?: () => void) {
    const a = audioRef.current;
    if (!a) return;
    if (fadeRef.current) window.clearInterval(fadeRef.current);
    const step = (target - a.volume) / 24;
    fadeRef.current = window.setInterval(() => {
      const a2 = audioRef.current;
      if (!a2) return;
      const next = a2.volume + step;
      if (Math.abs(target - a2.volume) < 0.03 || (step > 0 ? next >= target : next <= target)) {
        a2.volume = Math.max(0, Math.min(1, target));
        if (fadeRef.current) window.clearInterval(fadeRef.current);
        fadeRef.current = null;
        done?.();
      } else {
        a2.volume = Math.max(0, Math.min(1, next));
      }
    }, 60);
  }

  function toggle() {
    const next = !on;
    setOn(next);
    if (next) {
      if (!audioRef.current) {
        const a = new Audio("/ocean.mp3");
        a.loop = true;
        a.volume = 0;
        audioRef.current = a;
      }
      audioRef.current.play().catch(() => {});
      fadeTo(TARGET);
    } else {
      fadeTo(0, () => audioRef.current?.pause());
    }
  }

  // stop + clean up if the poem room unmounts
  useEffect(() => {
    return () => {
      if (fadeRef.current) window.clearInterval(fadeRef.current);
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      title={on ? "ocean ambience: on" : "ocean ambience: off"}
      className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 font-body text-sm font-semibold text-cream/90 backdrop-blur transition hover:bg-white/20"
    >
      <span className={on ? "animate-pulse" : "opacity-70"}>{on ? "🌊" : "🔈"}</span>
      {on ? "ocean on" : "ocean"}
    </button>
  );
}
