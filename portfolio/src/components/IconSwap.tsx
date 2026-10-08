"use client";

// Change the little picture in the browser tab, from /edit.
//
// Whatever is picked is fitted, whole, into a square: a transparent one for the
// tab, and one on a white ground for an iPhone's home screen, which paints
// transparency black. Nothing is cropped, so a wide drawing keeps its edges.

import { useEffect, useState } from "react";
import FileDrop from "@/components/FileDrop";
import { adminApi } from "@/components/editing";
import { webImage } from "@/lib/webImage";

async function square(file: File, size: number, ground: string | null, inset: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  if (ground) {
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, size, size);
  }
  const room = size * (1 - inset * 2);
  const scale = Math.min(room / bitmap.width, room / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  bitmap.close();
  return canvas.toDataURL("image/png").split(",")[1] ?? "";
}

export default function IconSwap({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const [own, setOwn] = useState(false);
  const [preview, setPreview] = useState("/site-icon");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ icon?: boolean }>("/api/admin/files")
      .then((d) => setOwn(!!d.icon))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(picked: File) {
    setBusy(true);
    setMsg("making the icon…");
    try {
      const file = await webImage(picked);
      const [tab, apple] = await Promise.all([
        square(file, 512, null, 0),
        square(file, 180, "#ffffff", 0.08),
      ]);
      for (const [kind, dataBase64] of [
        ["icon", tab],
        ["icon-apple", apple],
      ] as const) {
        await api("/api/admin/files", {
          method: "POST",
          body: JSON.stringify({ kind, ext: "png", dataBase64 }),
        });
      }
      setPreview(`data:image/png;base64,${tab}`);
      setOwn(true);
      setMsg("icon replaced ✓ browsers hold on to tab icons, so it can take a refresh to show");
    } catch {
      setMsg("that did not work. a png, jpg, webp or heic picture?");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setBusy(true);
    try {
      await api("/api/admin/files", { method: "DELETE", body: JSON.stringify({ kind: "icon" }) });
      setOwn(false);
      setPreview(`/icon-512.png`);
      setMsg("back to the otter ✓");
    } catch {
      setMsg("that did not work, try again?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* shown at tab size and at home-screen size, on the two grounds it lives on */}
      <span className="flex items-end gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="the tab icon" className="h-16 w-16 rounded-2xl bg-white object-contain p-1 shadow" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="" className="h-6 w-6 rounded bg-ink/80 object-contain p-0.5" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="" className="h-4 w-4 object-contain" />
      </span>
      <span className="flex items-center gap-1.5">
        <FileDrop>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/75 px-4 py-1.5 font-body text-sm font-semibold text-ink shadow-sm transition hover:bg-white">
            {busy ? "working…" : "✨ replace icon"}
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.heic,.heif"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
          </label>
        </FileDrop>
        {own && (
          <button
            type="button"
            title="back to the otter"
            disabled={busy}
            onClick={reset}
            className="rounded-full bg-white/75 px-2.5 py-1.5 font-body text-sm text-ink-soft shadow-sm transition hover:bg-white"
          >
            ↺
          </button>
        )}
      </span>
      {msg && <p className="w-full font-body text-xs text-ink-soft">{msg}</p>}
    </div>
  );
}
