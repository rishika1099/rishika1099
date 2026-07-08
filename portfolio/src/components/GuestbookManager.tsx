"use client";

// Moderate guestbook entries in the atelier: hide/show or delete any note.

import { useEffect, useState } from "react";
import { adminApi } from "@/components/editing";

interface Entry {
  id: string;
  name: string;
  message: string;
  mood?: string;
  at: string;
  hidden?: boolean;
}

const btn = "rounded-full px-3 py-1 font-body text-xs font-semibold transition";

export default function GuestbookManager({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [msg, setMsg] = useState("");

  const load = () =>
    api<{ entries: Entry[] }>("/api/admin/guestbook")
      .then((d) => setEntries(d.entries))
      .catch(() => setMsg("couldn't load the guestbook"));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(id: string, action: "hide" | "show" | "delete") {
    if (action === "delete" && !confirm("Delete this note for good?")) return;
    await api("/api/admin/guestbook", { method: "POST", body: JSON.stringify({ action, id }) });
    load();
  }

  if (!entries) return <p className="mt-4 font-body text-sm text-ink-soft">opening the guestbook… ✦</p>;

  return (
    <div className="mt-8">
      <p className="font-body text-sm font-bold text-ink">📖 guestbook ({entries.length})</p>
      {msg && <p className="mt-1 font-body text-sm text-ink-soft">{msg}</p>}
      {entries.length === 0 && <p className="mt-2 font-body text-sm text-ink-soft">no notes yet ✦</p>}
      <div className="mt-3 space-y-2">
        {entries.map((e) => (
          <div
            key={e.id}
            className={`rounded-2xl p-4 soft-card ${e.hidden ? "opacity-50" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-body text-sm font-bold text-ink">
                {e.name} {e.mood && <span className="font-normal text-ink-soft">· {e.mood}</span>}
                {e.hidden && <span className="ml-2 font-normal text-rose-500">(hidden)</span>}
              </p>
              <div className="flex shrink-0 gap-1.5">
                <button
                  className={`${btn} bg-white/70 text-ink-soft hover:bg-white`}
                  onClick={() => act(e.id, e.hidden ? "show" : "hide")}
                >
                  {e.hidden ? "show" : "hide"}
                </button>
                <button
                  className={`${btn} bg-rose/60 text-ink hover:bg-rose/80`}
                  onClick={() => act(e.id, "delete")}
                >
                  delete
                </button>
              </div>
            </div>
            <p className="mt-1 whitespace-pre-line font-body text-sm text-ink-soft">{e.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
