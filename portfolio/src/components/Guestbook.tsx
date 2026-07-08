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
      <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-lavender/40 px-3 py-1 font-body text-xs font-semibold text-ink">
        🌸 public wall · everyone who visits sees this
      </p>
      <p className="mt-2 font-body text-sm text-ink-soft">
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

      {/* the wall: notes pinned up like sticky notes, tinted by their mood */}
      <div className="mt-6">
        {entries === null && <p className="font-body text-sm text-ink-soft">opening the book… ✦</p>}
        {entries?.length === 0 && (
          <p className="rounded-2xl border-2 border-dashed border-ink/15 p-6 text-center font-body text-sm text-ink-soft">
            no notes yet, be the first to pin one up ✦
          </p>
        )}
        {!!entries?.length && (
          <div className="gap-3 [column-fill:balance] sm:columns-2">
            {entries.map((e, i) => {
              const m = e.mood ? MOOD[e.mood] : null;
              const tilt = i % 2 ? "rotate-[1.2deg]" : "-rotate-[1.2deg]";
              return (
                <div
                  key={e.id}
                  className={`mb-3 inline-block w-full break-inside-avoid rounded-2xl p-4 shadow-sm ring-1 ring-white/60 transition-transform hover:rotate-0 ${tilt}`}
                  style={{ backgroundColor: m ? `${m.tint}5c` : "rgba(255,255,255,0.6)" }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl leading-none" aria-hidden>
                      {m?.emoji ?? "✦"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-body text-sm font-bold text-ink">
                          {e.name || "someone"}
                        </p>
                        {m && (
                          <span className="shrink-0 font-body text-[11px] font-semibold text-ink-soft">
                            {e.mood}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 whitespace-pre-line font-body text-sm text-ink">
                        {e.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
