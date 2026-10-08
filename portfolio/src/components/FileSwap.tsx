"use client";

// Shared state for swapping the resume PDF / portrait photo from within an
// editor: upload straight from the device, reset back to the original.

import { useEffect, useState } from "react";
import { adminApi } from "@/components/editing";
import { smallImage, webImage } from "@/lib/webImage";
import type { Frame } from "@/lib/frame";

// The browser keeps its own copy of the portrait for a minute. Fetching it with
// "reload" replaces that copy, so the page that comes back shows the new photo
// and not the one just replaced.
async function showNewPortrait() {
  try {
    await fetch("/portrait", { cache: "reload" });
  } catch {
    // the reload below still happens; at worst the photo catches up in a minute
  }
  window.location.reload();
}

export function useFileSwap(keyVal: string) {
  const api = adminApi(keyVal);
  const [has, setHas] = useState<{ resume: boolean; portrait: boolean }>({
    resume: false,
    portrait: false,
  });
  const [msg, setMsg] = useState("");
  const [frame, setFrame] = useState<Frame | null>(null);

  const refresh = () =>
    api<{ resume: boolean; portrait: boolean; frame?: Frame | null }>("/api/admin/files")
      .then((d) => {
        setHas({ resume: d.resume, portrait: d.portrait });
        setFrame(d.frame ?? null);
      })
      .catch(() => {});

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(kind: "resume" | "portrait", picked: File) {
    setMsg(`uploading ${picked.name}…`);
    try {
      // the portrait is drawn in a small circle, so it travels at a size that fits one
      const file = kind === "portrait" ? await smallImage(picked, 1024) : await webImage(picked);
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
      if (kind === "portrait") await showNewPortrait();
    } catch {
      setMsg(`${kind} upload failed (a pdf under 4MB for resume; jpg, png, webp or heic for photo)`);
    }
  }

  async function reset(kind: "resume" | "portrait") {
    await api("/api/admin/files", { method: "DELETE", body: JSON.stringify({ kind }) });
    setMsg(`${kind} back to the original ✓`);
    refresh();
    if (kind === "portrait") await showNewPortrait();
  }

  /** how the portrait sits in its circle; null centres it */
  async function saveFrame(next: Frame | null) {
    try {
      await api("/api/admin/files", { method: "PATCH", body: JSON.stringify({ frame: next }) });
      setFrame(next);
      setMsg(next ? "framing saved ✓ live now" : "portrait centred ✓");
    } catch {
      setMsg("framing did not save, try again?");
    }
  }

  return { has, msg, frame, upload, reset, saveFrame };
}
