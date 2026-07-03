"use client";

// Private analytics room: aggregate visits (per day / page / country / city)
// plus the chatbot question log. Gated by STATS_KEY, nothing here is public.

import { useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import type { LoggedQuestion, VisitStats } from "@/lib/analytics";

type Stats = { visits: VisitStats; questions: LoggedQuestion[] };

function Board({ title, rec, max = 10 }: { title: string; rec: Record<string, number>; max?: number }) {
  const rows = Object.entries(rec).sort((a, b) => b[1] - a[1]).slice(0, max);
  const top = rows[0]?.[1] ?? 1;
  return (
    <div className="rounded-3xl p-5 soft-card">
      <h2 className="font-body text-base font-bold text-ink">{title}</h2>
      {rows.length === 0 && <p className="mt-2 font-body text-sm text-ink-soft">nothing yet ✦</p>}
      <div className="mt-3 space-y-2">
        {rows.map(([k, n]) => (
          <div key={k}>
            <div className="flex items-center justify-between gap-3 font-body text-sm">
              <span className="truncate text-ink">{k}</span>
              <span className="shrink-0 font-semibold text-ink-soft">{n}</span>
            </div>
            <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-white/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blush to-lavender"
                style={{ width: `${Math.round((n / top) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [key, setKey] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // remember the key on this device so it's a one-time entry
  useEffect(() => {
    const saved = localStorage.getItem("stats-key");
    if (saved) {
      setKey(saved);
      load(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load(k: string) {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/stats?key=${encodeURIComponent(k)}`);
      if (res.status === 401) {
        setErr("that's not the key 🌙");
        localStorage.removeItem("stats-key");
        return;
      }
      if (res.status === 503) {
        setErr("STATS_KEY isn't configured on this deploy yet.");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      setStats((await res.json()) as Stats);
      localStorage.setItem("stats-key", k);
    } catch {
      setErr("couldn't load stats, try again?");
    } finally {
      setBusy(false);
    }
  }

  const last14 = stats
    ? Object.fromEntries(
        Object.entries(stats.visits.byDay)
          .sort((a, b) => (a[0] < b[0] ? 1 : -1))
          .slice(0, 14),
      )
    : {};

  return (
    <PageShell vibe="midnight">
      <PageTitle className="text-cream">the night garden 🌙</PageTitle>
      <p className="mt-3 font-body text-base text-cream/70">
        nothing blooms here without a key ✦
      </p>

      {!stats && (
        <form
          className="mt-8 flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (key.trim()) load(key.trim());
          }}
        >
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="the key"
            className="w-full rounded-full border border-white/20 bg-white/10 px-5 py-2.5 font-body text-cream outline-none placeholder:text-cream/40 focus:border-blush/60"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-blush/80 px-6 py-2.5 font-body font-semibold text-ink transition hover:bg-blush disabled:opacity-50"
          >
            {busy ? "…" : "open"}
          </button>
        </form>
      )}
      {err && <p className="mt-3 font-body text-sm text-blush">{err}</p>}

      {stats && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["total visits", stats.visits.total],
              ["pages tracked", Object.keys(stats.visits.byPath).length],
              ["countries", Object.keys(stats.visits.byCountry).length],
              ["questions asked", stats.questions.length],
            ].map(([l, n]) => (
              <div key={String(l)} className="rounded-3xl p-4 text-center soft-card">
                <div className="font-display text-3xl font-bold text-ink">{n}</div>
                <div className="mt-1 font-body text-xs text-ink-soft">{l}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Board title="🗓️ last 14 days" rec={last14} max={14} />
            <Board title="📄 top pages" rec={stats.visits.byPath} />
            <Board title="🌍 countries" rec={stats.visits.byCountry} />
            <Board title="🏙️ cities" rec={stats.visits.byCity} />
          </div>

          <div className="mt-6 rounded-3xl p-5 soft-card">
            <h2 className="font-body text-base font-bold text-ink">
              💬 recent chatbot questions
            </h2>
            {stats.questions.length === 0 && (
              <p className="mt-2 font-body text-sm text-ink-soft">no questions yet ✦</p>
            )}
            <ul className="mt-3 space-y-2">
              {stats.questions.slice(0, 40).map((q, i) => (
                <li key={i} className="flex justify-between gap-4 font-body text-sm">
                  <span className="text-ink">{q.q}</span>
                  <span className="shrink-0 text-ink-soft/70">
                    {new Date(q.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-6 font-body text-xs text-cream/50">
            updated {stats.visits.updatedAt ? new Date(stats.visits.updatedAt).toLocaleString() : "never"} ·
            aggregate-only, no IPs or identifiers stored
          </p>
        </>
      )}
    </PageShell>
  );
}
