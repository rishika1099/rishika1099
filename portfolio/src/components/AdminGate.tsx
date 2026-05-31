"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminGate() {
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
      const res = await fetch("/api/admin/login", {
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
        className="rounded-[2rem] p-7 soft-card sm:p-9"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-6xl"
        >
          🗝️
        </motion.div>
        <h2
          style={{ fontFamily: "var(--font-halimun)" }}
          className="mt-3 text-2xl text-ink"
        >
          the writing desk
        </h2>
        <p className="mt-1 font-body text-base text-ink-soft">
          only you can tend the poems here ✦
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="admin key…"
            autoFocus
            className="rounded-full border border-lavender bg-white/80 px-5 py-3 text-center font-body text-ink outline-none focus:border-blush focus:ring-2 focus:ring-blush/50"
          />
          <button
            type="submit"
            disabled={loading || !password}
            className="rounded-full bg-blush px-6 py-3 font-display font-semibold text-ink transition hover:scale-105 disabled:opacity-50"
          >
            {loading ? "unlocking…" : "unlock the desk ✦"}
          </button>
        </form>

        {error && (
          <p className="mt-3 font-body text-sm text-[#c0506b]">{error}</p>
        )}
      </motion.div>
    </div>
  );
}
