"use client";

// A little guestbook: sign a note, see everyone else's, each tagged with an
// LLM-classified mood. Aggregate, no login. Honeypot for basic spam defense.

import { useEffect, useState } from "react";

interface Entry {
  id: string;
  name: string;
  message: string;
  mood?: string;
  at: string;
}

const MOOD: Record<string, { emoji: string; tint: string }> = {
  sweet: { emoji: "💗", tint: "#f7b7c9" },
  excited: { emoji: "⚡", tint: "#f6d99b" },
  curious: { emoji: "🤔", tint: "#bfe0f0" },
  funny: { emoji: "😄", tint: "#cdeac0" },
  kind: { emoji: "🌸", tint: "#e6d7f5" },
  proud: { emoji: "🌟", tint: "#ffc6a8" },
};

export default function Guestbook() {
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/guestbook")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => setEntries([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 2) return;
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, message, website }),
      });
      const d = await r.json();
      if (d.entry) {
        setEntries((cur) => [d.entry, ...(cur ?? [])]);
        setName("");
        setMessage("");
        setMsg("thanks for signing 🌸");
      } else {
        setMsg("hmm, that didn't go through, try again?");
      }
    } catch {
      setMsg("something wobbled, try again?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 w-full max-w-xl text-left">
      <h2 className="font-display text-xl font-bold text-ink">📖 sign the guestbook</h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        leave a little note, it gets a mood ✦ (a model reads the vibe, not you)
      </p>

      <form onSubmit={submit} className="mt-4 space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="your name (optional)"
          maxLength={40}
          className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-2 focus:ring-blush/30"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="say hi…"
          maxLength={500}
          className="min-h-20 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-2 focus:ring-blush/30"
        />
        {/* honeypot: hidden from people, catches bots */}
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-ink px-5 py-2 font-body text-sm font-semibold text-cream transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "signing…" : "sign"}
          </button>
          {msg && <span className="font-body text-xs text-ink-soft">{msg}</span>}
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {entries === null && <p className="font-body text-sm text-ink-soft">opening the book… ✦</p>}
        {entries?.length === 0 && (
          <p className="font-body text-sm text-ink-soft">be the first to sign ✦</p>
        )}
        {entries?.map((e) => {
          const m = e.mood ? MOOD[e.mood] : null;
          return (
            <div key={e.id} className="rounded-2xl p-4 soft-card">
              <div className="flex items-center justify-between gap-3">
                <p className="font-body text-sm font-bold text-ink">{e.name}</p>
                {m && (
                  <span
                    className="rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink"
                    style={{ backgroundColor: m.tint }}
                  >
                    {m.emoji} {e.mood}
                  </span>
                )}
              </div>
              <p className="mt-1 whitespace-pre-line font-body text-sm text-ink-soft">{e.message}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
