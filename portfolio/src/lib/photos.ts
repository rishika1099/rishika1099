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
export const CLUSTERS_FILE = path.join(PHOTOS_DIR, "clusters.json");
export const CAPTIONS_KEY = "__captions__";
export const CLUSTERS_KEY = "__clusters__";

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
    return files.map((file) => ({ src: `/api/photo/${file}`, caption: captions[file] ?? "" }));
  }

  const captions = readCaptions();
  return listPhotoFiles().map((file) => ({
    src: `/photos/${file}`,
    caption: captions[file] ?? "",
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
