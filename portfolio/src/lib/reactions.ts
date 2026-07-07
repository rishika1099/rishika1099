// Tiny aggregate reactions (heart / sparkle) per poem or post. No login, no
// identifiers, just counts, stored in Netlify Blobs on deploy or a gitignored
// local file in dev. Each item is keyed like "poem:<slug>" or "post:<slug>".

import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";

export type ReactionKind = "heart" | "sparkle";
export type ReactionCounts = { heart: number; sparkle: number };
type ReactionMap = Record<string, ReactionCounts>;

const KEY = "counts";
const LOCAL_FILE = path.join(process.cwd(), "src/content/reactions.json");
const KINDS: ReactionKind[] = ["heart", "sparkle"];

async function read(): Promise<ReactionMap> {
  try {
    let raw: string | null = null;
    if (blobsEnabled()) {
      const s = await store("reactions");
      raw = (await s.get(KEY, { type: "text" })) ?? null;
    } else if (fs.existsSync(LOCAL_FILE)) {
      raw = fs.readFileSync(LOCAL_FILE, "utf8");
    }
    return raw ? (JSON.parse(raw) as ReactionMap) : {};
  } catch {
    return {};
  }
}

async function write(map: ReactionMap): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("reactions");
    await s.setJSON(KEY, map);
  } else {
    fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(map, null, 2));
  }
}

const empty = (): ReactionCounts => ({ heart: 0, sparkle: 0 });

export async function getReactions(id: string): Promise<ReactionCounts> {
  const map = await read();
  return { ...empty(), ...(map[id] ?? {}) };
}

export async function getAllReactions(): Promise<ReactionMap> {
  return read();
}

/** Add or remove one reaction (delta is clamped to ±1, never below zero). */
export async function react(id: string, kind: ReactionKind, delta: number): Promise<ReactionCounts> {
  if (!KINDS.includes(kind)) throw new Error("bad kind");
  const step = delta >= 0 ? 1 : -1;
  const map = await read();
  const cur = { ...empty(), ...(map[id] ?? {}) };
  cur[kind] = Math.max(0, cur[kind] + step);
  map[id.slice(0, 120)] = cur;
  await write(map);
  return cur;
}
