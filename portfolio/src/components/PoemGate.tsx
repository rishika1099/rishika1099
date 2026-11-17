"use client";

import { useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import styles from "./PoemSky.module.css";

export default function PoemGate({ onUnlocked, embedded = false }: { onUnlocked: () => void; embedded?: boolean }) {
  const reducedMotion = useReducedMotion();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        onUnlocked();
      } else {
        setError(data.error || "Hmm, try again ✦");
        setShake((s) => s + 1);
      }
    } catch {
      setError("Something went sideways. Try again?");
      setShake((s) => s + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={embedded ? styles.gate : "mx-auto mt-10 max-w-md text-center"}>
      <m.div
        key={shake}
        animate={shake && !reducedMotion ? { x: [0, -10, 10, -8, 8, 0] } : {}}
        transition={{ duration: 0.45 }}
        className={embedded ? undefined : "rounded-[2rem] p-7 soft-card sm:p-9"}
      >
        {!embedded && <m.div
          animate={reducedMotion ? {} : { y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-6xl"
        >
          🚪
        </m.div>}
        <h2
          style={embedded ? undefined : { fontFamily: "var(--font-halimun)" }}
          className={embedded ? styles.gateHeading : "mt-3 text-2xl text-ink"}
        >
          this little room is locked
        </h2>
        <p className={embedded ? styles.gateHint : "mt-1 font-body text-base text-ink-soft"}>
          whisper the secret word to come in ✦
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="secret word…"
            aria-label="Secret word"
            aria-invalid={!!error}
            aria-describedby={error ? "poem-gate-error" : undefined}
            className="rounded-full border border-lavender bg-white/80 px-5 py-3 text-center font-body text-ink outline-none focus:border-blush focus:ring-2 focus:ring-blush/50"
          />
          <button
            type="submit"
            disabled={loading || !password}
            className="rounded-full bg-blush px-6 py-3 font-display font-semibold text-ink transition hover:scale-105 disabled:opacity-50"
          >
            {loading ? "knocking…" : "knock ✦"}
          </button>
        </form>

        {error && (
          <p id="poem-gate-error" role="alert" className={embedded ? styles.gateError : "mt-3 font-body text-sm text-[#c0506b]"}>{error}</p>
        )}
      </m.div>
    </div>
  );
}
