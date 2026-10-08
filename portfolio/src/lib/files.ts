// Replaceable files (resume PDF, portrait photo) uploaded from the editors.
// Blobs on deploy, a gitignored local folder in dev; when nothing is uploaded
// the site falls back to the static/GitHub originals.

import fs from "node:fs";
import path from "node:path";
import { blobsEnabled } from "@/lib/blobs";
import { cleanFrame, type Frame } from "@/lib/frame";

export type FileKind = "resume" | "portrait" | "icon" | "icon-apple";

const LOCAL_DIR = path.join(process.cwd(), "src/content/files");

// Read-your-writes: a replaced file is the new one on the very next request,
// not the old one for the minute an eventually consistent read can lag.
async function filesStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore({ name: "files", consistency: "strong" });
}
const META_SUFFIX = ".meta.json";

export interface StoredFile {
  buf: Buffer;
  mime: string;
}

export async function readFileKind(kind: FileKind): Promise<StoredFile | null> {
  try {
    if (blobsEnabled()) {
      const s = await filesStore();
      const meta = (await s.get(`${kind}${META_SUFFIX}`, { type: "json" })) as { mime?: string } | null;
      const ab = await s.get(kind, { type: "arrayBuffer" });
      if (!ab) return null;
      return { buf: Buffer.from(ab), mime: meta?.mime ?? "application/octet-stream" };
    }
    const f = path.join(LOCAL_DIR, kind);
    const m = path.join(LOCAL_DIR, `${kind}${META_SUFFIX}`);
    if (!fs.existsSync(f)) return null;
    const mime = fs.existsSync(m)
      ? (JSON.parse(fs.readFileSync(m, "utf8")) as { mime?: string }).mime ?? "application/octet-stream"
      : "application/octet-stream";
    return { buf: fs.readFileSync(f), mime };
  } catch {
    return null;
  }
}

export async function writeFileKind(kind: FileKind, buf: Buffer, mime: string): Promise<void> {
  if (blobsEnabled()) {
    const s = await filesStore();
    await s.set(kind, new Blob([new Uint8Array(buf)]));
    await s.setJSON(`${kind}${META_SUFFIX}`, { mime });
  } else {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_DIR, kind), buf);
    fs.writeFileSync(path.join(LOCAL_DIR, `${kind}${META_SUFFIX}`), JSON.stringify({ mime }));
  }
}

export async function deleteFileKind(kind: FileKind): Promise<void> {
  if (blobsEnabled()) {
    const s = await filesStore();
    await s.delete(kind);
    await s.delete(`${kind}${META_SUFFIX}`);
  } else {
    for (const f of [path.join(LOCAL_DIR, kind), path.join(LOCAL_DIR, `${kind}${META_SUFFIX}`)]) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  }
}

// How the portrait sits in its circle. Kept beside the photo, not inside it, so
// the framing can change without the photo being uploaded again.
const FRAME_KEY = "portrait.frame.json";

export async function getPortraitFrame(): Promise<Frame | null> {
  try {
    if (blobsEnabled()) return cleanFrame(await (await filesStore()).get(FRAME_KEY, { type: "json" }));
    const f = path.join(LOCAL_DIR, FRAME_KEY);
    return fs.existsSync(f) ? cleanFrame(JSON.parse(fs.readFileSync(f, "utf8"))) : null;
  } catch {
    return null;
  }
}

/** null clears it (back to a centred crop) */
export async function setPortraitFrame(frame: Frame | null): Promise<void> {
  if (blobsEnabled()) {
    const s = await filesStore();
    if (frame) await s.setJSON(FRAME_KEY, frame);
    else await s.delete(FRAME_KEY);
    return;
  }
  const f = path.join(LOCAL_DIR, FRAME_KEY);
  if (frame) {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
    fs.writeFileSync(f, JSON.stringify(frame));
  } else if (fs.existsSync(f)) fs.unlinkSync(f);
}
