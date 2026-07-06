"use client";

// Manage a poem's AI artwork: regenerate a fresh one and preview it before it
// goes live, keep versions you like to come back to, or upload your own.

import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/components/editing";

interface SavedArt {
  id: string;
  ts: number;
}
interface Status {
  hasActive: boolean;
  hasDraft: boolean;
  saved: SavedArt[];
}

export default function PoemArtManager({
  slug,
  keyVal,
  dark = false,
}: {
  slug: string;
  keyVal: string;
  dark?: boolean;
}) {
  const api = adminApi(keyVal);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [bust, setBust] = useState(() => Date.now());

  const base = `/api/admin/poem-art/${slug}`;
  const imgSrc = (variant: string, id = "") =>
    `${base}/image?variant=${variant}${id ? `&id=${id}` : ""}&key=${encodeURIComponent(keyVal)}&t=${bust}`;

  const load = () =>
    api<Status>(base)
      .then(setStatus)
      .catch(() => setMsg("couldn't load the artwork"));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function act(action: string, extra: Record<string, unknown> = {}, label = "") {
    setBusy(label || action);
    setMsg("");
    try {
      const r = await api<{ ok?: boolean; error?: string }>(base, {
        method: "POST",
        body: JSON.stringify({ action, ...extra }),
      });
      if (r.error) setMsg(r.error);
      setBust(Date.now());
      await load();
    } catch {
      setMsg(action === "regenerate" ? "generation failed (is the OpenAI key set?)" : "something wobbled");
    } finally {
      setBusy("");
    }
  }

  async function upload(file: File) {
    setBusy("upload");
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(base, { method: "POST", headers: { "x-admin-key": keyVal }, body: fd });
      if (!res.ok) throw new Error();
      setBust(Date.now());
      await load();
    } catch {
      setMsg("upload failed (png/jpg/webp)");
    } finally {
      setBusy("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const text = dark ? "text-cream" : "text-ink";
  const sub = dark ? "text-cream/60" : "text-ink-soft";
  const card = dark ? "border border-white/15 bg-white/5" : "soft-card";
  const btn = "rounded-full px-3.5 py-1.5 font-body text-xs font-semibold transition disabled:opacity-50";
  const btnPrimary = `${btn} ${dark ? "bg-cream text-ink" : "bg-ink text-cream"} hover:opacity-90`;
  const btnGhost = `${btn} ${dark ? "bg-white/15 text-cream hover:bg-white/25" : "bg-white/70 text-ink-soft hover:bg-white"}`;
  const frame = "h-28 w-28 shrink-0 rounded-2xl object-cover ring-1 ring-black/10";

  if (!slug) return null;
  if (!status)
    return <p className={`mt-3 font-body text-xs ${sub}`}>loading the artwork… ✦</p>;

  return (
    <div className={`mt-4 rounded-3xl p-4 ${card}`}>
      <p className={`font-body text-sm font-bold ${text}`}>🎨 artwork</p>
      {(msg || busy) && (
        <p className={`mt-1 font-body text-xs ${sub}`}>{busy ? `${busy}…` : msg}</p>
      )}

      <div className="mt-3 flex flex-wrap items-start gap-4">
        {/* current live art */}
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc("active")}
            alt="current artwork"
            className={frame}
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
          />
          <p className={`mt-1 font-body text-[10px] uppercase tracking-wide ${sub}`}>live now</p>
        </div>

        {/* a freshly made / uploaded candidate, awaiting your yes */}
        {status.hasDraft && (
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgSrc("draft")} alt="new candidate" className={`${frame} ring-2 ring-blush`} />
            <div className="mt-1 flex justify-center gap-1">
              <button className={btnPrimary} disabled={!!busy} onClick={() => act("accept", {}, "using it")}>
                use this
              </button>
              <button className={btnGhost} disabled={!!busy} onClick={() => act("discard", {}, "discarding")}>
                discard
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className={btnPrimary} disabled={!!busy} onClick={() => act("regenerate", {}, "generating")}>
          ✨ regenerate
        </button>
        <button
          className={btnGhost}
          disabled={!!busy || !status.hasActive}
          onClick={() => act("save", {}, "saving")}
          title="keep the current art so you can come back to it"
        >
          ⭑ save this one
        </button>
        <button className={btnGhost} disabled={!!busy} onClick={() => fileRef.current?.click()}>
          ⬆ upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </div>

      {status.saved.length > 0 && (
        <div className="mt-4">
          <p className={`font-body text-[11px] font-semibold uppercase tracking-wide ${sub}`}>
            saved versions
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {status.saved.map((s) => (
              <div key={s.id} className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc("saved", s.id)} alt="saved artwork" className={frame} />
                <div className="mt-1 flex justify-center gap-1">
                  <button className={btnGhost} disabled={!!busy} onClick={() => act("restore", { id: s.id }, "restoring")}>
                    use
                  </button>
                  <button className={btnGhost} disabled={!!busy} onClick={() => act("deleteSaved", { id: s.id }, "removing")}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
