// Files pinned to About entries (certificate images, diploma PDFs). Bytes live
// in the "attachments" Blobs store on deploy, a gitignored local folder in dev.
// They're public: the About page shows them, and /api/attachment/<id> serves
// them. Meta (name + mime) rides alongside as <id>.meta.json.

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { blobsEnabled, store } from "@/lib/blobs";

const LOCAL_DIR = path.join(process.cwd(), "src/content/attachments");
const META = ".meta.json";

export interface AttachmentFile {
  buf: Buffer;
  mime: string;
  name: string;
}

export interface AttachmentMeta {
  id: string;
  name: string;
  kind: "image" | "pdf";
}

const MIME_KIND: Record<string, "image" | "pdf"> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
  "image/avif": "image",
  "application/pdf": "pdf",
};

export function kindForMime(mime: string): "image" | "pdf" | null {
  return MIME_KIND[mime] ?? null;
}

// slug-safe id so it maps cleanly to a URL path segment
function newId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 20);
}

export async function saveAttachment(buf: Buffer, mime: string, name: string): Promise<AttachmentMeta> {
  const kind = kindForMime(mime);
  if (!kind) throw new Error("unsupported type");
  const id = newId();
  const meta = { mime, name };
  if (blobsEnabled()) {
    const s = await store("attachments");
    await s.set(id, new Blob([new Uint8Array(buf)]));
    await s.setJSON(`${id}${META}`, meta);
  } else {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_DIR, id), buf);
    fs.writeFileSync(path.join(LOCAL_DIR, `${id}${META}`), JSON.stringify(meta));
  }
  return { id, name, kind };
}

export async function readAttachment(id: string): Promise<AttachmentFile | null> {
  if (!/^[a-z0-9]+$/i.test(id)) return null; // guard against path tricks
  try {
    if (blobsEnabled()) {
      const s = await store("attachments");
      const meta = (await s.get(`${id}${META}`, { type: "json" })) as { mime?: string; name?: string } | null;
      const ab = await s.get(id, { type: "arrayBuffer" });
      if (!ab) return null;
      return { buf: Buffer.from(ab), mime: meta?.mime ?? "application/octet-stream", name: meta?.name ?? id };
    }
    const f = path.join(LOCAL_DIR, id);
    if (!fs.existsSync(f)) return null;
    const m = path.join(LOCAL_DIR, `${id}${META}`);
    const meta = fs.existsSync(m) ? (JSON.parse(fs.readFileSync(m, "utf8")) as { mime?: string; name?: string }) : {};
    return { buf: fs.readFileSync(f), mime: meta.mime ?? "application/octet-stream", name: meta.name ?? id };
  } catch {
    return null;
  }
}

export async function deleteAttachment(id: string): Promise<void> {
  if (!/^[a-z0-9]+$/i.test(id)) return;
  if (blobsEnabled()) {
    const s = await store("attachments");
    await s.delete(id);
    await s.delete(`${id}${META}`);
  } else {
    for (const f of [path.join(LOCAL_DIR, id), path.join(LOCAL_DIR, `${id}${META}`)]) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
  }
}
