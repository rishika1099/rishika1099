// Per-project overrides edited on /work/edit. The auto-pulled GitHub values
// stay the default; only fields she actually changes are stored (Netlify
// Blobs, gitignored local file in dev), so clearing a field falls back to
// the automatic name/blurb/tags.

import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";
import type { Category, Domain } from "@/data/projects";

export interface ProjectOverride {
  name?: string;
  blurb?: string;
  featured?: boolean;
  categories?: Category[];
  domains?: Domain[];
  tags?: string[];
}

export type OverrideMap = Record<string, ProjectOverride>; // key: repo slug (lowercase)

const KEY = "overrides";
const LOCAL_FILE = path.join(process.cwd(), "src/content/project-overrides.json");

export const repoSlug = (repoUrl: string) =>
  (repoUrl.split("/").pop() ?? "").toLowerCase();

export async function readProjectOverrides(): Promise<OverrideMap> {
  try {
    let raw: string | null = null;
    if (blobsEnabled()) {
      const s = await store("projects");
      raw = (await s.get(KEY, { type: "text" })) ?? null;
    } else if (fs.existsSync(LOCAL_FILE)) {
      raw = fs.readFileSync(LOCAL_FILE, "utf8");
    }
    if (raw) return JSON.parse(raw) as OverrideMap;
  } catch {
    // fall through
  }
  return {};
}

async function writeAll(map: OverrideMap): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("projects");
    await s.setJSON(KEY, map);
  } else {
    fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(map, null, 2));
  }
}

/**
 * Merge one project's override with what's already stored. A field that is
 * absent stays as-is; a field sent explicitly empty is removed (back to auto);
 * a non-empty field is set.
 */
export async function saveProjectOverride(slug: string, o: ProjectOverride): Promise<void> {
  const map = await readProjectOverrides();
  const next: ProjectOverride = { ...(map[slug] ?? {}) };
  if (o.name !== undefined) {
    if (o.name.trim()) next.name = o.name.trim();
    else delete next.name;
  }
  if (o.blurb !== undefined) {
    if (o.blurb.trim()) next.blurb = o.blurb.trim();
    else delete next.blurb;
  }
  if (typeof o.featured === "boolean") next.featured = o.featured;
  if (o.categories !== undefined) {
    if (o.categories.length) next.categories = o.categories;
    else delete next.categories;
  }
  if (o.domains !== undefined) {
    if (o.domains.length) next.domains = o.domains;
    else delete next.domains;
  }
  if (o.tags !== undefined) {
    if (o.tags.length) next.tags = o.tags;
    else delete next.tags;
  }
  if (Object.keys(next).length === 0) delete map[slug];
  else map[slug] = next;
  await writeAll(map);
}

export async function clearProjectOverride(slug: string): Promise<void> {
  const map = await readProjectOverrides();
  delete map[slug];
  await writeAll(map);
}
