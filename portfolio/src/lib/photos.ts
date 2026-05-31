import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";

export interface Photo {
  /** URL the gallery loads: /photos/<file> locally, /api/photo/<file> on Blobs */
  src: string;
  /** auto-generated (and cached) caption */
  caption: string;
}

/**
 * Photos live as image files in this local folder (gitignored, off the public
 * repo). On the deployed site they're served from the private "photos" Blobs
 * store, which `npm run sync` populates from this same folder.
 */
export const PHOTOS_DIR = path.join(process.cwd(), "public/photos");
export const CAPTIONS_FILE = path.join(PHOTOS_DIR, "captions.json");
export const CAPTIONS_KEY = "__captions__";

const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)$/i;

export function readCaptions(): Record<string, string> {
  if (!fs.existsSync(CAPTIONS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CAPTIONS_FILE, "utf8")) as Record<string, string>;
  } catch {
    return {};
  }
}

export function listPhotoFiles(): string[] {
  if (!fs.existsSync(PHOTOS_DIR)) return [];
  return fs.readdirSync(PHOTOS_DIR).filter((f) => IMAGE_RE.test(f)).sort();
}

export async function listPhotos(): Promise<Photo[]> {
  if (blobsEnabled()) {
    const s = await store("photos");
    const { blobs } = await s.list();
    const files = blobs.map((b) => b.key).filter((k) => IMAGE_RE.test(k)).sort();

    let captions: Record<string, string> = {};
    const raw = await s.get(CAPTIONS_KEY, { type: "text" });
    if (raw) {
      try {
        captions = JSON.parse(raw) as Record<string, string>;
      } catch {
        captions = {};
      }
    }
    return files.map((file) => ({ src: `/api/photo/${file}`, caption: captions[file] ?? "" }));
  }

  const captions = readCaptions();
  return listPhotoFiles().map((file) => ({
    src: `/photos/${file}`,
    caption: captions[file] ?? "",
  }));
}
