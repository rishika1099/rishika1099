"use client";

import { useState } from "react";
import { adminApi } from "@/components/editing";

/**
 * "Regroup now", beside the photo uploader.
 *
 * The gallery's groups are remade on a schedule, every hour, whenever the
 * photos have changed. This starts that early, for the moment after a batch of
 * uploads when an hour is too long to look at a photo with no group.
 */
export default function RegroupButton({ keyVal, className = "" }: { keyVal: string; className?: string }) {
  const api = adminApi(keyVal);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    setMsg("asking…");
    try {
      const d = await api<{ started: boolean; reason?: string }>("/api/admin/photos/regroup", { method: "POST" });
      setMsg(
        d.started
          ? "regrouping ✓ the gallery updates in about three minutes"
          : `could not start it early (${d.reason ?? "unknown"}). it still regroups by itself within the hour`,
      );
    } catch {
      setMsg("could not start it early. it still regroups by itself within the hour");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={go}
        disabled={busy}
        title="group every photo again by what it looks like"
        className={className}
      >
        🧩 regroup now
      </button>
      {msg && <span className="font-body text-xs text-ink-soft">{msg}</span>}
    </span>
  );
}
