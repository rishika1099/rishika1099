"use client";

// Swap the resume PDF or the portrait photo straight from the editor. The
// uploaded file lives in Blobs; "reset" returns to the original (the PDF in
// the repo / the GitHub avatar).

import { useEffect, useState } from "react";
import { adminApi } from "@/components/editing";

const btn =
  "rounded-full px-3.5 py-1 font-body text-xs font-semibold transition disabled:opacity-50";

export default function FileSwapPanel({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const [state, setState] = useState<{ resume: boolean; portrait: boolean } | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () =>
    api<{ resume: boolean; portrait: boolean }>("/api/admin/files")
      .then(setState)
      .catch(() => setMsg("couldn't check files"));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(kind: "resume" | "portrait", file: File) {
    setBusy(true);
    setMsg(`uploading ${file.name}…`);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).split(",")[1] ?? "");
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      await api("/api/admin/files", {
        method: "POST",
        body: JSON.stringify({ kind, ext: file.name.split(".").pop(), dataBase64: b64 }),
      });
      setMsg(`${kind} replaced ✓ live now`);
      refresh();
    } catch {
      setMsg(`${kind} upload failed (pdf for resume; jpg/png/webp for portrait)`);
    } finally {
      setBusy(false);
    }
  }

  async function reset(kind: "resume" | "portrait") {
    await api("/api/admin/files", { method: "DELETE", body: JSON.stringify({ kind }) });
    setMsg(`${kind} back to the original ✓`);
    refresh();
  }

  const control = (kind: "resume" | "portrait", label: string, accept: string, uploaded?: boolean) => (
    <span className="flex items-center gap-1.5">
      <label className={`${btn} cursor-pointer bg-ink text-cream hover:opacity-90`}>
        {label}
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={busy}
          onChange={(e) => e.target.files?.[0] && upload(kind, e.target.files[0])}
        />
      </label>
      {uploaded && (
        <button className={`${btn} bg-white/70 text-ink-soft hover:bg-white`} onClick={() => reset(kind)}>
          reset
        </button>
      )}
    </span>
  );

  return (
    <div className="mx-auto mt-4 flex w-fit max-w-[92vw] flex-wrap items-center gap-3 rounded-full px-4 py-2 soft-card">
      <span className="font-body text-xs font-semibold text-ink-soft">🗂️ files:</span>
      {control("portrait", "🖼️ replace photo", ".jpg,.jpeg,.png,.webp", state?.portrait)}
      {control("resume", "📄 replace resume", ".pdf", state?.resume)}
      {msg && <span className="font-body text-[11px] text-ink-soft">{msg}</span>}
    </div>
  );
}
