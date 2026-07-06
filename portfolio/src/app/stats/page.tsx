"use client";

// Private analytics room: aggregate visitors, traffic sources, devices, custom
// conversion events, Core Web Vitals, and the chatbot question log. Gated by
// STATS_KEY. All aggregate + non-identifying, nothing here is public.

import { useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import type { LoggedQuestion, VisitStats } from "@/lib/analytics";

type Stats = { visits: VisitStats; questions: LoggedQuestion[] };

function Board({
  title,
  rec,
  max = 8,
  label,
}: {
  title: string;
  rec: Record<string, number>;
  max?: number;
  label?: (k: string) => string;
}) {
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
              <span className="truncate text-ink">{label ? label(k) : k === "/" ? "home 🏠" : k}</span>
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

// Core Web Vitals thresholds (good / needs-improvement / poor)
const VITAL_META: Record<string, { good: number; poor: number; unit: string; digits?: number }> = {
  LCP: { good: 2500, poor: 4000, unit: "ms" },
  INP: { good: 200, poor: 500, unit: "ms" },
  FCP: { good: 1800, poor: 3000, unit: "ms" },
  TTFB: { good: 800, poor: 1800, unit: "ms" },
  CLS: { good: 0.1, poor: 0.25, unit: "", digits: 3 },
};

function Vitals({ vitals }: { vitals: VisitStats["vitals"] }) {
  const keys = Object.keys(VITAL_META).filter((k) => vitals[k]?.n);
  if (keys.length === 0)
    return (
      <div className="rounded-3xl p-5 soft-card">
        <h2 className="font-body text-base font-bold text-ink">⚡ core web vitals</h2>
        <p className="mt-2 font-body text-sm text-ink-soft">no samples yet ✦</p>
      </div>
    );
  return (
    <div className="rounded-3xl p-5 soft-card">
      <h2 className="font-body text-base font-bold text-ink">⚡ core web vitals (average)</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {keys.map((k) => {
          const m = VITAL_META[k];
          const avg = vitals[k].sum / vitals[k].n;
          const tone = avg <= m.good ? "#2f8f74" : avg <= m.poor ? "#c98f2d" : "#e0708f";
          const shown = m.digits ? avg.toFixed(m.digits) : Math.round(avg).toString();
          return (
            <div key={k} className="rounded-2xl bg-white/50 p-3 text-center">
              <div className="font-display text-xl font-bold" style={{ color: tone }}>
                {shown}
                <span className="text-xs font-normal text-ink-soft"> {m.unit}</span>
              </div>
              <div className="mt-0.5 font-body text-[11px] font-semibold text-ink-soft">{k}</div>
              <div className="font-body text-[10px] text-ink-soft/60">n={vitals[k].n}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [key, setKey] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

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

  const v = stats?.visits;
  const last14 = v
    ? Object.fromEntries(Object.entries(v.byDay).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14))
    : {};
  const visitors = v ? v.newVisitors + v.returningVisitors : 0;
  const returnPct = visitors ? Math.round((v!.returningVisitors / visitors) * 100) : 0;

  return (
    <PageShell vibe="midnight">
      <div className="text-center">
        <PageTitle className="text-cream">the night garden 🌙</PageTitle>
        <p className="mt-3 font-body text-base text-cream/70">nothing blooms here without a key ✦</p>
      </div>

      {!stats && (
        <form
          className="mx-auto mt-8 flex max-w-md gap-2"
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
      {err && <p className="mt-3 text-center font-body text-sm text-blush">{err}</p>}

      {stats && v && (
        <>
          {/* headline numbers */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["page views", v.total],
              ["visitors", visitors],
              ["returning", `${returnPct}%`],
              ["questions", stats.questions.length],
            ].map(([l, n]) => (
              <div key={String(l)} className="rounded-3xl p-4 text-center soft-card">
                <div className="font-display text-3xl font-bold text-ink">{n}</div>
                <div className="mt-1 font-body text-xs text-ink-soft">{l}</div>
              </div>
            ))}
          </div>

          {/* traffic + engagement boards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Board title="🗓️ last 14 days" rec={last14} max={14} />
            <Board title="📄 top pages" rec={v.byPath} />
            <Board title="🔗 referrers" rec={v.byReferrer} label={(k) => k} />
            <Board title="🎯 clicks & conversions" rec={v.events} />
            <Board title="🌍 countries" rec={v.byCountry} />
            <Board title="🏙️ cities" rec={v.byCity} />
            <Board title="💻 devices" rec={v.byDevice} />
            <Board title="🧭 browsers" rec={v.byBrowser} />
            <Board title="🖥️ operating systems" rec={v.byOS} />
            <div className="rounded-3xl p-5 soft-card">
              <h2 className="font-body text-base font-bold text-ink">👥 new vs returning</h2>
              <div className="mt-4 flex items-end gap-6">
                <div className="text-center">
                  <div className="font-display text-2xl font-bold text-ink">{v.newVisitors}</div>
                  <div className="font-body text-xs text-ink-soft">new</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl font-bold text-ink">{v.returningVisitors}</div>
                  <div className="font-body text-xs text-ink-soft">returning</div>
                </div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-mint to-lavender"
                  style={{ width: `${100 - returnPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* performance */}
          <div className="mt-6">
            <Vitals vitals={v.vitals} />
          </div>

          {/* chatbot log */}
          <div className="mt-6 rounded-3xl p-5 soft-card">
            <h2 className="font-body text-base font-bold text-ink">💬 recent chatbot questions</h2>
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
            updated {v.updatedAt ? new Date(v.updatedAt).toLocaleString() : "never"} · aggregate-only, no
            IPs or identifiers stored, no consent banner needed
          </p>
        </>
      )}
    </PageShell>
  );
}
