"use client";

// Shared state for swapping the resume PDF / portrait photo from within an
// editor: upload straight from the device, reset back to the original.

import { useEffect, useState } from "react";
import { adminApi } from "@/components/editing";

export function useFileSwap(keyVal: string) {
  const api = adminApi(keyVal);
  const [has, setHas] = useState<{ resume: boolean; portrait: boolean }>({
    resume: false,
    portrait: false,
  });
  const [msg, setMsg] = useState("");

  const refresh = () =>
    api<{ resume: boolean; portrait: boolean }>("/api/admin/files").then(setHas).catch(() => {});

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(kind: "resume" | "portrait", file: File) {
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
      // the portrait <img> caches; nudge it to refetch
      if (kind === "portrait") window.location.reload();
    } catch {
      setMsg(`${kind} upload failed (pdf for resume; jpg/png/webp for photo)`);
    }
  }

  async function reset(kind: "resume" | "portrait") {
    await api("/api/admin/files", { method: "DELETE", body: JSON.stringify({ kind }) });
    setMsg(`${kind} back to the original ✓`);
    refresh();
    if (kind === "portrait") window.location.reload();
  }

  return { has, msg, upload, reset };
}
