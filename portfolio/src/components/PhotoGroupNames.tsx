"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/components/editing";

interface Group {
  id: string;
  label: string;
  count: number;
}

/**
 * The gallery's group names, to be corrected by hand.
 *
 * The groups are found by a model and so are their names, and a name is the
 * part of this a visitor actually reads. A name set here is kept through later
 * regroups for as long as the group is mostly the same photos.
 */
export default function PhotoGroupNames({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ groups?: Group[] }>("/api/admin/photos/clusters")
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => setGroups([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!groups?.length) return null;

  async function save() {
    if (!groups) return;
    setMsg("saving…");
    try {
      const names = Object.fromEntries(groups.map((g) => [g.id, g.label]));
      const d = await api<{ groups: Group[] }>("/api/admin/photos/clusters", {
        method: "PATCH",
        body: JSON.stringify({ names }),
      });
      setGroups(d.groups);
      setMsg("names saved ✓ live now");
    } catch {
      setMsg("that did not save, try again?");
    }
  }

  return (
    <div className="mt-4 rounded-2xl bg-white/60 p-3">
      <p className="font-body text-xs font-semibold text-ink-soft">
        🏷 the gallery&apos;s groups (rename any of them; a name stays through later regroups)
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {groups.map((g) => (
          <label key={g.id} className="flex items-center gap-2 font-body text-xs text-ink-soft">
            <input
              value={g.label}
              maxLength={40}
              onChange={(e) =>
                setGroups((gs) => (gs ?? []).map((x) => (x.id === g.id ? { ...x, label: e.target.value } : x)))
              }
              className="min-w-0 flex-1 rounded-lg border border-dashed border-ink/15 bg-white/70 px-2 py-1 font-body text-sm text-ink outline-none focus:border-blush"
            />
            <span className="shrink-0 tabular-nums">· {g.count}</span>
          </label>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={save}
          className="rounded-full bg-ink px-4 py-1.5 font-body text-xs font-semibold text-cream transition hover:opacity-90"
        >
          save names
        </button>
        {msg && <span className="font-body text-xs text-ink-soft">{msg}</span>}
      </div>
    </div>
  );
}
