import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";
import { PHOTOS_DIR } from "@/lib/photos";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  // Only allow plain image filenames, no path traversal.
  if (!/^[a-zA-Z0-9._-]+\.(jpe?g|png|webp|gif|avif)$/i.test(file)) {
    return new Response("Bad request", { status: 400 });
  }
  const ext = file.split(".").pop()!.toLowerCase();
  const contentType = TYPES[ext] ?? "application/octet-stream";
  const headers = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  if (blobsEnabled()) {
    const s = await store("photos");
    const buf = await s.get(file, { type: "arrayBuffer" });
    if (!buf) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(buf), { headers });
  }

  const local = path.join(PHOTOS_DIR, file);
  if (!fs.existsSync(local)) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(fs.readFileSync(local)), { headers });
}
