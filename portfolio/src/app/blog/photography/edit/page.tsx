"use client";

// In-place editor for photography: the tagline is editable and the gallery
// itself is manageable, upload straight from your device (auto-captioned) or
// remove a photo, all in the page's own sunset light.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import { AdminGate, adminApi } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";

interface Photo {
  src: string;
  caption: string;
  frame?: { x: number; y: number; zoom: number };
}

// Drag the photo to choose the region the gallery's polaroid window shows;
// slide to zoom. Mirrors the real window (same object-cover crop).
function FrameAdjuster({
  photo,
  onSave,
  onClose,
}: {
  photo: Photo;
  onSave: (f: { x: number; y: number; zoom: number } | null) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState({ x: photo.frame?.x ?? 50, y: photo.frame?.y ?? 50, zoom: photo.frame?.zoom ?? 1 });
  const drag = useRef<{ px: number; py: number } | null>(null);

  return (
    <div className="mt-2 rounded-2xl bg-white/70 p-3">
      <p className="font-body text-xs font-semibold text-ink-soft">
        🎯 drag the photo to frame it, slide to zoom (this is exactly the gallery window)
      </p>
      <div className="mt-2 flex flex-wrap items-start gap-4">
        <div
          className="relative h-48 w-[184px] shrink-0 cursor-grab touch-none overflow-hidden rounded-sm bg-white shadow active:cursor-grabbing"
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            drag.current = { px: e.clientX, py: e.clientY };
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            const dx = e.clientX - drag.current.px;
            const dy = e.clientY - drag.current.py;
            drag.current = { px: e.clientX, py: e.clientY };
            setF((v) => ({
              ...v,
              x: Math.max(0, Math.min(100, v.x - (dx / 184) * 100)),
              y: Math.max(0, Math.min(100, v.y - (dy / 192) * 100)),
            }));
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerLeave={() => (drag.current = null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt="framing preview"
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
            style={{
              objectPosition: `${f.x}% ${f.y}%`,
              transform: f.zoom !== 1 ? `scale(${f.zoom})` : undefined,
              transformOrigin: `${f.x}% ${f.y}%`,
            }}
          />
        </div>
        <div className="min-w-40 flex-1 space-y-3">
          <label className="block font-body text-xs text-ink-soft">
            zoom · {f.zoom.toFixed(2)}x
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={f.zoom}
              onChange={(e) => setF({ ...f, zoom: Number(e.target.value) })}
              className="mt-1 w-full accent-[#c77dba]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full bg-ink px-4 py-1.5 font-body text-xs font-semibold text-cream transition hover:opacity-90"
              onClick={() => onSave(f)}
            >
              save framing
            </button>
            <button
              className="rounded-full bg-white/80 px-4 py-1.5 font-body text-xs font-semibold text-ink-soft transition hover:bg-white"
              onClick={() => onSave(null)}
            >
              reset to center
            </button>
            <button
              className="rounded-full bg-white/80 px-4 py-1.5 font-body text-xs font-semibold text-ink-soft transition hover:bg-white"
              onClick={onClose}
            >
              close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Gallery({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [framing, setFraming] = useState<string | null>(null);

  const refresh = () =>
    api<{ photos: Photo[] }>("/api/admin/photos")
      .then((d) => setPhotos(d.photos))
      .catch(() => setMsg("couldn't load the album"));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(file: File) {
    setBusy(true);
    setMsg(`uploading ${file.name}…`);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).split(",")[1] ?? "");
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const d = await api<{ caption?: string }>("/api/admin/photos", {
        method: "POST",
        body: JSON.stringify({ name: file.name, dataBase64: b64 }),
      });
      setMsg(
        d.caption
          ? `uploaded ✓ captioned: "${d.caption}" (it joins a theme on the next npm run media)`
          : "uploaded ✓",
      );
      refresh();
    } catch {
      setMsg("upload failed (jpg/png/webp, under 8MB)");
    } finally {
      setBusy(false);
    }
  }

  async function saveCaption(src: string, caption: string) {
    const name = src.split("/").pop()!;
    setMsg("saving caption…");
    try {
      await api("/api/admin/photos", { method: "POST", body: JSON.stringify({ name, caption }) });
      setMsg("caption saved ✓");
    } catch {
      setMsg("caption save failed");
    }
  }

  async function saveFrame(src: string, frame: { x: number; y: number; zoom: number } | null) {
    const name = src.split("/").pop()!;
    setMsg("saving framing…");
    try {
      await api("/api/admin/photos", { method: "POST", body: JSON.stringify({ name, frame }) });
      setMsg(frame ? "framing saved ✓" : "framing reset ✓");
      setFraming(null);
      refresh();
    } catch {
      setMsg("framing save failed");
    }
  }

  async function remove(src: string) {
    const name = src.split("/").pop()!;
    if (!confirm(`Delete ${name}?`)) return;
    await api("/api/admin/photos", { method: "DELETE", body: JSON.stringify({ name }) });
    refresh();
  }

  return (
    <div className="mt-8">
      <label className="inline-block cursor-pointer rounded-full bg-ink px-4 py-1.5 font-body text-sm font-semibold text-cream transition hover:opacity-90">
        {busy ? "working…" : "⇪ upload a photo"}
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          disabled={busy}
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </label>
      {msg && <p className="mt-3 font-body text-sm text-ink-soft">{msg}</p>}
      <div className="mt-5 columns-2 gap-4 sm:columns-3 [&>figure]:mb-4">
        {photos === null && <p className="font-body text-sm text-ink-soft">opening the album… ✦</p>}
        {photos?.map((p) => (
          <figure key={p.src} className="break-inside-avoid overflow-hidden rounded-2xl soft-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={p.caption} className="w-full" />
            {framing === p.src && (
              <FrameAdjuster photo={p} onSave={(f) => saveFrame(p.src, f)} onClose={() => setFraming(null)} />
            )}
            <figcaption className="flex items-center gap-1.5 p-2">
              <input
                defaultValue={p.caption}
                placeholder="caption…"
                onBlur={(e) => e.target.value !== p.caption && saveCaption(p.src, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className="w-full rounded-lg border border-dashed border-ink/15 bg-white/50 px-1.5 py-0.5 font-body text-[11px] text-ink-soft outline-none focus:border-blush"
              />
              <button
                className={`shrink-0 font-body text-xs font-semibold hover:underline ${p.frame ? "text-[#c77dba]" : "text-ink-soft"}`}
                onClick={() => setFraming(framing === p.src ? null : p.src)}
                title="choose which region the gallery shows"
              >
                🎯
              </button>
              <button
                className="shrink-0 font-body text-xs font-semibold text-rose-500 hover:underline"
                onClick={() => remove(p.src)}
                aria-label="delete photo"
              >
                ✕
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

function Editor({ keyVal }: { keyVal: string }) {
  const { ready, box, bar } = usePassageEditor(
    keyVal,
    ["photography.intro"],
    "/blog/photography",
  );
  if (!ready)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;
  return (
    <PageShell vibe="sunset">
      {bar}
      <PageTitle className="text-ink">photography 📷</PageTitle>
      <div className="mt-3">
        <Link href="/blog" className="font-body text-sm text-ink-soft hover:text-ink">
          ← back to the writing room
        </Link>
      </div>
      <div className="mt-3 max-w-2xl">{box("photography.intro", "font-body text-lg text-ink-soft")}</div>
      <Gallery keyVal={keyVal} />
    </PageShell>
  );
}

export default function PhotographyEdit() {
  return <AdminGate vibe="sunset">{(key) => <Editor keyVal={key} />}</AdminGate>;
}
