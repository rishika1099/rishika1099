"use client";

// A little semantic-search toy: type anything and see which projects are nearest
// in embedding space, with a live similarity bar. Reuses /api/search-projects
// (cosine over cached project embeddings), the same machinery behind the galaxy.

import { useState } from "react";

interface Hit {
  name: string;
  blurb: string;
  emoji: string;
  repo: string;
  demo?: string;
  score: number;
}

const EXAMPLES = [
  "making LLMs run faster",
  "computer vision on the edge",
  "fairness in healthcare data",
  "causal inference",
  "something with images",
];

export default function ProjectMatch() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [asked, setAsked] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function run(query: string) {
    const s = query.trim();
    if (s.length < 2) return;
    setBusy(true);
    setErr("");
    setAsked(s);
    try {
      const r = await fetch(`/api/search-projects?q=${encodeURIComponent(s)}`);
      if (r.status === 503) {
        setErr("the matcher isn't configured on this deploy yet.");
        setHits(null);
        return;
      }
      const d = (await r.json()) as { results?: Hit[] };
      setHits(d.results ?? []);
    } catch {
      setErr("hmm, that didn't work, try again?");
      setHits(null);
    } finally {
      setBusy(false);
    }
  }

  const top = hits && hits[0] ? hits[0].score : 1;

  return (
    <section className="mt-10 rounded-[2rem] p-6 soft-card sm:p-8">
      <h2 className="font-display text-xl font-bold text-ink">🔮 match me to a project</h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        type an interest, an embedding model finds the closest projects by meaning (not keywords).
      </p>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. real-time ML on tiny devices"
          className="w-full rounded-full border border-white/70 bg-white/80 px-5 py-2.5 font-body text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-2 focus:ring-blush/30"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-full bg-ink px-5 py-2.5 font-body text-sm font-semibold text-cream transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "…" : "match"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => {
              setQ(ex);
              run(ex);
            }}
            className="rounded-full bg-white/60 px-3 py-1 font-body text-xs font-semibold text-ink-soft transition hover:bg-white"
          >
            {ex}
          </button>
        ))}
      </div>

      {err && <p className="mt-4 font-body text-sm text-rose-500">{err}</p>}

      {hits && (
        <div className="mt-5 space-y-3">
          {hits.length === 0 && (
            <p className="font-body text-sm text-ink-soft">
              nothing close enough for &ldquo;{asked}&rdquo;, try another phrasing ✦
            </p>
          )}
          {hits.map((h) => (
            <div key={h.name} className="rounded-2xl bg-white/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-body text-sm font-bold text-ink">
                    <span className="mr-1">{h.emoji}</span>
                    {h.name}
                  </p>
                  <p className="mt-0.5 font-body text-xs text-ink-soft">{h.blurb}</p>
                </div>
                <span className="shrink-0 font-body text-xs font-semibold text-ink-soft">
                  {Math.round(h.score * 100)}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-mint to-lavender"
                  style={{ width: `${Math.round((h.score / top) * 100)}%` }}
                />
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <a
                  href={h.repo}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white/70 px-3 py-0.5 font-body text-[11px] font-semibold text-ink-soft transition hover:bg-white"
                >
                  code ↗
                </a>
                {h.demo && (
                  <a
                    href={h.demo}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-white/70 px-3 py-0.5 font-body text-[11px] font-semibold text-ink-soft transition hover:bg-white"
                  >
                    demo ↗
                  </a>
                )}
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("ask-question", { detail: `Tell me about ${h.name}.` }),
                    )
                  }
                  className="rounded-full bg-lavender/50 px-3 py-0.5 font-body text-[11px] font-semibold text-ink transition hover:bg-lavender/70"
                >
                  ask about this
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
