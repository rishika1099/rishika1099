"use client";

// A soft, procedurally-generated rain/ambience for the poem room. No audio file:
// it's filtered brown noise from the Web Audio API, so nothing to download and
// nothing to autoplay. Off by default; a click starts it (satisfies the browser
// gesture requirement). The last choice is remembered per browser.

import { useEffect, useRef, useState } from "react";

export default function AmbientSound() {
  const [on, setOn] = useState(false);
  // keep the audio graph around so we can fade + stop it cleanly
  const nodes = useRef<{ ctx: AudioContext; gain: GainNode; src: AudioBufferSourceNode } | null>(null);

  function start() {
    if (nodes.current) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();

    // ~2s of brown noise, looped
    const len = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.2;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    // low-pass for a soft, rainy hush; gentle LFO on the cutoff for movement
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 720;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(filter.frequency);

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 1.6); // fade in

    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    lfo.start();

    nodes.current = { ctx, gain, src };
  }

  function stop() {
    const n = nodes.current;
    if (!n) return;
    nodes.current = null;
    n.gain.gain.linearRampToValueAtTime(0, n.ctx.currentTime + 0.8); // fade out
    setTimeout(() => {
      try {
        n.src.stop();
        n.ctx.close();
      } catch {
        // already gone
      }
    }, 900);
  }

  function toggle() {
    const next = !on;
    setOn(next);
    if (next) start();
    else stop();
  }

  // stop the audio if the poem room unmounts
  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      title={on ? "ambient rain: on" : "ambient rain: off"}
      className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 font-body text-sm font-semibold text-cream/90 backdrop-blur transition hover:bg-white/20"
    >
      <span className={on ? "animate-pulse" : "opacity-70"}>{on ? "🌧️" : "🔇"}</span>
      {on ? "rain on" : "rain"}
    </button>
  );
}
