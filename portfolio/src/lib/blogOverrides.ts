// Overrides for auto-pulled Substack posts, keyed by their stable /p/<slug>.
// The RSS pipeline stays the default; only fields she changes are stored.

import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";
import type { Category, Domain } from "@/data/projects";

export interface BlogOverride {
  title?: string;
  excerpt?: string;
  tech?: Category[];
  domains?: Domain[];
}
export type BlogOverrideMap = Record<string, BlogOverride>;

const KEY = "blog-overrides";
const LOCAL_FILE = path.join(process.cwd(), "src/content/blog-overrides.json");

export const externalKey = (url?: string) => url?.match(/\/p\/([^/?#]+)/)?.[1] ?? "";

export async function readBlogOverrides(): Promise<BlogOverrideMap> {
  try {
    let raw: string | null = null;
    if (blobsEnabled()) {
      const s = await store("blogs");
      raw = (await s.get(KEY, { type: "text" })) ?? null;
    } else if (fs.existsSync(LOCAL_FILE)) {
      raw = fs.readFileSync(LOCAL_FILE, "utf8");
    }
    if (raw) return JSON.parse(raw) as BlogOverrideMap;
  } catch {
    // fall through
  }
  return {};
}

export async function saveBlogOverride(key: string, o: BlogOverride): Promise<void> {
  const map = await readBlogOverrides();
  const next: BlogOverride = { ...(map[key] ?? {}) };
  if (o.title !== undefined) (o.title.trim() ? (next.title = o.title.trim()) : delete next.title);
  if (o.excerpt !== undefined) (o.excerpt.trim() ? (next.excerpt = o.excerpt.trim()) : delete next.excerpt);
  if (o.tech !== undefined) (o.tech.length ? (next.tech = o.tech) : delete next.tech);
  if (o.domains !== undefined) (o.domains.length ? (next.domains = o.domains) : delete next.domains);
  if (Object.keys(next).length === 0) delete map[key];
  else map[key] = next;
  if (blobsEnabled()) {
    const s = await store("blogs");
    await s.setJSON(KEY, map);
  } else {
    fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(map, null, 2));
  }
}
