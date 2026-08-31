/**
 * A little store for anything a model generates per item, so it is bought once.
 *
 * Keying a whole set under one hash meant that publishing a single repo changed
 * the signature and threw away every rewrite, paying to rebuild all of them to
 * gain one card. Each entry is stored against a hash of what it was generated
 * from, so a new item costs one item and everything already generated is read
 * straight back.
 *
 * Netlify Blobs in production, a gitignored file in dev, where without it every
 * restart re-paid for the lot.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";

export const srcHash = (s: string) => createHash("sha1").update(s).digest("hex").slice(0, 12);

export interface Cached {
  /** hash of the source this was generated from */
  src: string;
  text: string;
}

const memory = new Map<string, Record<string, Cached>>();

const storeKey = (name: string) => `explain-v3-${name}`;
const localFile = (name: string) =>
  path.join(process.cwd(), "src/content/explain-cache", `${name}.json`);

export async function readStore(name: string): Promise<Record<string, Cached>> {
  const local = memory.get(name);
  if (local) return local;
  if (blobsEnabled()) {
    try {
      const s = await store("explain");
      const raw = (await s.get(storeKey(name), { type: "json" })) as Record<string, Cached> | null;
      if (raw) {
        memory.set(name, raw);
        return raw;
      }
    } catch {
      // a cache miss must never break the page
    }
  } else {
    try {
      const parsed = JSON.parse(fs.readFileSync(localFile(name), "utf8")) as Record<string, Cached>;
      memory.set(name, parsed);
      return parsed;
    } catch {
      // not written yet
    }
  }
  return {};
}

/**
 * Merge one entry into a store.
 *
 * Not writeStore with a spread of what the caller read earlier: six projects
 * generating in parallel each read the same snapshot and then wrote it back
 * with only their own addition, so five of the six were lost every time and the
 * cache never filled. Merging against the live map instead of a stale copy is
 * the whole fix.
 */
export async function putStore(name: string, key: string, value: Cached) {
  const current = await readStore(name);
  await writeStore(name, { ...current, [key]: value });
}

export async function writeStore(name: string, all: Record<string, Cached>) {
  memory.set(name, all);
  if (blobsEnabled()) {
    try {
      const s = await store("explain");
      await s.setJSON(storeKey(name), all);
    } catch {
      // still fine, it just costs the next instance a regeneration
    }
    return;
  }
  try {
    fs.mkdirSync(path.dirname(localFile(name)), { recursive: true });
    fs.writeFileSync(localFile(name), JSON.stringify(all, null, 2));
  } catch {
    // dev convenience only
  }
}
