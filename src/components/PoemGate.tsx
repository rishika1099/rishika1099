"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PoemGate() {
  const router = useRouter();
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
        router.refresh();
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
    <div className="mx-auto mt-10 max-w-md text-center">
      <motion.div
        key={shake}
        animate={shake ? { x: [0, -10, 10, -8, 8, 0] } : {}}
        transition={{ duration: 0.45 }}
        className="rounded-[2rem] p-9 soft-card"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-6xl"
        >
          🚪
        </motion.div>
        <h2 className="mt-3 font-display text-2xl font-bold text-ink">
          this little room is locked
        </h2>
        <p className="mt-1 font-hand text-xl text-ink-soft">
          whisper the secret word to come in
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="secret word…"
            autoFocus
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
          <p className="mt-3 font-body text-sm text-[#c0506b]">{error}</p>
        )}
      </motion.div>
    </div>
  );
}
