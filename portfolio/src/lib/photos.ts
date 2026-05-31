import fs from "node:fs";
import path from "node:path";

export interface Photo {
  /** public URL, e.g. /photos/sunset.jpg */
  src: string;
  /** auto-generated (and cached) caption */
  caption: string;
}

/**
 * Photos live as image files in this local folder, which is gitignored so they
 * never land in the public Git repo. Drop a `.jpg/.png/.webp` in here to add one;
 * run `npm run media` to auto-generate its caption.
 */
export const PHOTOS_DIR = path.join(process.cwd(), "public/photos");
export const CAPTIONS_FILE = path.join(PHOTOS_DIR, "captions.json");

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
  return fs
    .readdirSync(PHOTOS_DIR)
    .filter((f) => IMAGE_RE.test(f))
    .sort();
}

export function listPhotos(): Photo[] {
  const captions = readCaptions();
  return listPhotoFiles().map((file) => ({
    src: `/photos/${file}`,
    caption: captions[file] ?? "",
  }));
}
