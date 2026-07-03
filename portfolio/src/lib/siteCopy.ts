// Merged view of the site's editable passages: repo defaults from
// src/data/copy.ts, overridden by edits saved in the atelier (Netlify Blobs
// on deploy, a gitignored local file in dev). Edits go live with no rebuild.

import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";
import { copyDefaults, type CopyMap } from "@/data/copy";

const KEY = "overrides";
const LOCAL_FILE = path.join(process.cwd(), "src/content/copy-overrides.json");

async function readOverrides(): Promise<CopyMap> {
  try {
    let raw: string | null = null;
    if (blobsEnabled()) {
      const s = await store("copy");
      raw = (await s.get(KEY, { type: "text" })) ?? null;
    } else if (fs.existsSync(LOCAL_FILE)) {
      raw = fs.readFileSync(LOCAL_FILE, "utf8");
    }
    if (raw) {
      const parsed = JSON.parse(raw) as CopyMap;
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    // fall through to defaults
  }
  return {};
}

/** id -> current text (override if present, else the repo default). */
export async function getCopy(): Promise<CopyMap> {
  const overrides = await readOverrides();
  const out: CopyMap = {};
  for (const [id, block] of Object.entries(copyDefaults)) {
    const o = overrides[id];
    out[id] = typeof o === "string" && o.trim() ? o : block.text;
  }
  return out;
}

/** Persist texts; entries identical to the default are dropped from storage. */
export async function saveCopy(texts: CopyMap): Promise<void> {
  const overrides: CopyMap = {};
  for (const [id, block] of Object.entries(copyDefaults)) {
    const t = texts[id];
    if (typeof t === "string" && t.trim() && t !== block.text) overrides[id] = t;
  }
  if (blobsEnabled()) {
    const s = await store("copy");
    await s.setJSON(KEY, overrides);
  } else {
    fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(overrides, null, 2));
  }
}

export async function clearCopy(): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("copy");
    await s.delete(KEY);
  } else if (fs.existsSync(LOCAL_FILE)) {
    fs.unlinkSync(LOCAL_FILE);
  }
}
