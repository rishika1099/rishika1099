"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/components/editing";

/**
 * What the models have written, and a button to make them write it again.
 *
 * Each of these rebuilds itself when its source changes, so this is not for
 * staleness. It is for the times the writing is simply not good enough, which a
 * hash cannot detect and only she can judge.
 */

interface Store {
  id: string;
  label: string;
  count: number;
}

const btn =
  "rounded-full px-3.5 py-1 font-body text-xs font-semibold transition disabled:opacity-50";

export default function GeneratedManager({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const router = useRouter();
  const [stores, setStores] = useState<Store[] | null>(null);
  const [msg, setMsg] = useState("");

  async function refresh() {
    const d = await api<{ stores: Store[] }>("/api/admin/generated");
    setStores(d.stores);
  }

  useEffect(() => {
    // Loading once on mount, which is what this rule is warning about in
    // general and is the right thing here: there is no external system to
    // synchronise, only a list to fetch before anything can be shown.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().catch(() => setMsg("could not load"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function clear(id: string, label: string) {
    setMsg(`clearing ${label}…`);
    try {
      await api("/api/admin/generated", { method: "DELETE", body: JSON.stringify({ id }) });
      setMsg(`${label}: cleared, will be written again on the next visit`);
      await refresh();
      router.refresh();
    } catch {
      setMsg("could not clear that one");
    }
  }

  if (stores === null) return <p className="font-body text-sm text-ink-soft">loading…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-body text-lg font-bold text-ink">✨ what the models wrote</h3>
        {msg && <span className="font-body text-xs text-ink-soft">{msg}</span>}
      </div>
      <p className="mt-1 font-body text-xs text-ink-soft/70">
        each of these rebuilds itself when its source changes, so this is only for when the writing
        is not good enough. Clearing one costs the next visitor a few seconds, once.
      </p>

      <div className="mt-4 space-y-2">
        {stores.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/50 px-3 py-2"
          >
            <span className="font-body text-sm font-semibold text-ink">{s.label}</span>
            <span className="font-body text-xs text-ink-soft">
              {s.count === 0 ? "nothing written yet" : `${s.count} written`}
            </span>
            <button
              className={`${btn} ml-auto bg-white/70 text-ink-soft hover:bg-white disabled:opacity-40`}
              disabled={s.count === 0}
              onClick={() => clear(s.id, s.label)}
            >
              write it again
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
