"use client";

// The ✨ rephrase panel: her private writing assistant, shared by the ink
// editor and the resume editor. Sends the selected text to /api/admin/rephrase
// (key-gated) and lists alternatives from whichever providers are configured;
// clicking one hands it back via onPick.

import { useEffect, useState } from "react";

interface Suggestion {
  provider: string;
  text: string;
}

const TONES: [id: string, label: string][] = [
  ["improve", "✨ improve"],
  ["tighter", "✂️ tighter"],
  ["formal", "🎩 formal"],
  ["whimsical", "🎐 whimsical"],
];

const PROVIDER_BADGE: Record<string, string> = {
  openai: "🟢 gpt",
  claude: "🟠 claude",
  gemini: "🔵 gemini",
};

export default function RephrasePanel({
  text,
  onPick,
  dark = false,
  latex = false,
}: {
  text: string;
  onPick: (replacement: string) => void;
  dark?: boolean;
  latex?: boolean; // hint the model to preserve LaTeX escapes
}) {
  const [tone, setTone] = useState("improve");
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function fetchSuggestions(t: string) {
    setBusy(true);
    setErr("");
    setSuggestions(null);
    try {
      const res = await fetch("/api/admin/rephrase", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-key": localStorage.getItem("admin-key") ?? "",
        },
        body: JSON.stringify({ text, tone: t, latex }),
      });
      const d = (await res.json()) as { suggestions?: Suggestion[]; error?: string };
      if (!res.ok) {
        setErr(d.error ?? "that didn't work, try again?");
      } else if (!d.suggestions?.length) {
        setErr("no suggestions came back, try again?");
      } else {
        setSuggestions(d.suggestions);
      }
    } catch {
      setErr("that didn't work, try again?");
    } finally {
      setBusy(false);
    }
  }

  // auto-fetch once on open (deferred so the effect body stays setState-free)
  useEffect(() => {
    const t = setTimeout(() => fetchSuggestions(tone), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chip = (active: boolean) =>
    `rounded-full px-2.5 py-1 font-body text-[11px] font-semibold transition ${
      active
        ? dark
          ? "bg-blush/40 text-cream"
          : "bg-blush/60 text-ink"
        : dark
          ? "bg-white/10 text-cream/70 hover:bg-white/20"
          : "bg-white/70 text-ink-soft hover:bg-white"
    }`;
  const card = `w-full rounded-xl p-2.5 text-left font-body text-xs leading-relaxed transition ${
    dark ? "bg-white/10 text-cream hover:bg-white/20" : "bg-white/80 text-ink hover:bg-white"
  }`;
  const soft = dark ? "text-cream/60" : "text-ink-soft";

  return (
    <div className="w-72 max-w-full space-y-2">
      <p className={`font-body text-[11px] italic ${soft}`}>
        &ldquo;{text.length > 90 ? `${text.slice(0, 90)}…` : text}&rdquo;
      </p>
      <div className="flex flex-wrap gap-1">
        {TONES.map(([id, label]) => (
          <button
            key={id}
            type="button"
            disabled={busy}
            onClick={() => {
              setTone(id);
              fetchSuggestions(id);
            }}
            className={chip(tone === id)}
          >
            {label}
          </button>
        ))}
      </div>
      {busy && <p className={`font-body text-xs ${soft}`}>thinking… ✦</p>}
      {err && !busy && <p className="font-body text-xs text-rose-400">{err}</p>}
      {suggestions && !busy && (
        <div className="max-h-64 space-y-1.5 overflow-auto">
          {suggestions.map((s, i) => (
            <button key={i} type="button" onClick={() => onPick(s.text)} className={card} title="click to replace">
              <span className={`mb-0.5 block font-body text-[10px] font-semibold ${soft}`}>
                {PROVIDER_BADGE[s.provider] ?? s.provider}
              </span>
              {s.text}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
