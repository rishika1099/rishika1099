import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";

export interface PhotoFrame {
  x: number; // focal point, 0..100 (%)
  y: number;
  zoom: number; // 1..3
}

export interface Photo {
  /** URL the gallery loads: /photos/<file> locally, /api/photo/<file> on Blobs */
  src: string;
  /** auto-generated (and cached) caption */
  caption: string;
  /** which region of the photo the gallery window shows (set in /blog/photography/edit) */
  frame?: PhotoFrame;
}

/**
 * Photos live as image files in this local folder (gitignored, off the public
 * repo). On the deployed site they're served from the private "photos" Blobs
 * store, which `npm run sync` populates from this same folder.
 */
export const PHOTOS_DIR = path.join(process.cwd(), "public/photos");
export const CAPTIONS_FILE = path.join(PHOTOS_DIR, "captions.json");
export const CLUSTERS_FILE = path.join(PHOTOS_DIR, "clusters.json");
export const CAPTIONS_KEY = "__captions__";
export const CLUSTERS_KEY = "__clusters__";
export const FRAMES_KEY = "__frames__";
export const FRAMES_FILE = path.join(PHOTOS_DIR, "frames.json");

const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)$/i;

export interface PhotoGroup {
  label: string | null;
  photos: Photo[];
}
export interface Clusters {
  k: number;
  silhouette: number;
  labels: Record<string, string>;
  assignments: Record<string, number>;
}

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
    const frames = await readFramesAny();
    return files.map((file) => ({
      src: `/api/photo/${file}`,
      caption: captions[file] ?? "",
      frame: frames[file],
    }));
  }

  const captions = readCaptions();
  const frames = await readFramesAny();
  return listPhotoFiles().map((file) => ({
    src: `/photos/${file}`,
    caption: captions[file] ?? "",
    frame: frames[file],
  }));
}

async function readClusters(): Promise<Clusters | null> {
  let raw: string | null = null;
  if (blobsEnabled()) {
    const s = await store("photos");
    raw = (await s.get(CLUSTERS_KEY, { type: "text" })) ?? null;
  } else if (fs.existsSync(CLUSTERS_FILE)) {
    raw = fs.readFileSync(CLUSTERS_FILE, "utf8");
  }
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Clusters;
  } catch {
    return null;
  }
}

/**
 * Photos grouped into the clusters found by the embedding + k-means pipeline.
 * Falls back to one ungrouped group when there's no clusters.json.
 */
export async function getPhotoData(): Promise<{ groups: PhotoGroup[]; silhouette: number | null }> {
  const photos = await listPhotos();
  const clusters = await readClusters();
  if (!clusters || photos.length < 4) {
    return { groups: [{ label: null, photos }], silhouette: null };
  }

  const byCluster = new Map<number, Photo[]>();
  for (const p of photos) {
    const file = p.src.split("/").pop() ?? "";
    const c = clusters.assignments[file] ?? -1;
    if (!byCluster.has(c)) byCluster.set(c, []);
    byCluster.get(c)!.push(p);
  }
  const groups: PhotoGroup[] = [...byCluster.entries()]
    .map(([c, ps]) => ({ label: clusters.labels[c] ?? "more", photos: ps }))
    .sort((a, b) => b.photos.length - a.photos.length);

  return { groups, silhouette: clusters.silhouette };
}

// ---- write operations for the secret /edit room ----

async function readCaptionsAny(): Promise<Record<string, string>> {
  if (blobsEnabled()) {
    const s = await store("photos");
    const raw = await s.get(CAPTIONS_KEY, { type: "text" });
    try {
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  }
  return readCaptions();
}

async function writeCaptionsAny(captions: Record<string, string>): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("photos");
    await s.setJSON(CAPTIONS_KEY, captions);
  } else {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
    fs.writeFileSync(CAPTIONS_FILE, JSON.stringify(captions, null, 2));
  }
}

export async function writePhoto(file: string, buf: Buffer): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("photos");
    await s.set(file, new Blob([new Uint8Array(buf)]));
  } else {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
    fs.writeFileSync(path.join(PHOTOS_DIR, file), buf);
  }
}

export async function setCaption(file: string, caption: string): Promise<void> {
  const captions = await readCaptionsAny();
  captions[file] = caption;
  await writeCaptionsAny(captions);
}

async function readFramesAny(): Promise<Record<string, PhotoFrame>> {
  try {
    if (blobsEnabled()) {
      const s = await store("photos");
      const raw = await s.get(FRAMES_KEY, { type: "text" });
      return raw ? (JSON.parse(raw) as Record<string, PhotoFrame>) : {};
    }
    if (fs.existsSync(FRAMES_FILE)) return JSON.parse(fs.readFileSync(FRAMES_FILE, "utf8"));
  } catch {
    // fall through
  }
  return {};
}

async function writeFramesAny(frames: Record<string, PhotoFrame>): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("photos");
    await s.setJSON(FRAMES_KEY, frames);
  } else {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
    fs.writeFileSync(FRAMES_FILE, JSON.stringify(frames, null, 2));
  }
}

/** null clears the frame (back to a centered crop) */
export async function setFrame(file: string, frame: PhotoFrame | null): Promise<void> {
  const frames = await readFramesAny();
  if (frame) {
    frames[file] = {
      x: Math.max(0, Math.min(100, frame.x)),
      y: Math.max(0, Math.min(100, frame.y)),
      zoom: Math.max(1, Math.min(3, frame.zoom)),
    };
  } else {
    delete frames[file];
  }
  await writeFramesAny(frames);
}

export async function removePhoto(file: string): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("photos");
    await s.delete(file);
  } else {
    const f = path.join(PHOTOS_DIR, file);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  const captions = await readCaptionsAny();
  if (file in captions) {
    delete captions[file];
    await writeCaptionsAny(captions);
  }
  const frames = await readFramesAny();
  if (file in frames) {
    delete frames[file];
    await writeFramesAny(frames);
  }
}
