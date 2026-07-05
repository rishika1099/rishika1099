// Merged view of the site's editable passages, resolved in three layers:
//   1. repo defaults from src/data/copy.ts (what ships in the code)
//   2. a pinned "baseline" you promote in the atelier ("make current the
//      default"), so reverting comes back to your edits, not the code
//   3. live overrides from the current editing session
// override wins over baseline wins over the repo default. Everything is stored
// in Netlify Blobs on deploy, or a gitignored local file in dev, and goes live
// with no rebuild.

import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";
import { copyDefaults, type CopyMap } from "@/data/copy";

const OVERRIDES_KEY = "overrides";
const BASELINE_KEY = "baseline";
const LOCAL_OVERRIDES = path.join(process.cwd(), "src/content/copy-overrides.json");
const LOCAL_BASELINE = path.join(process.cwd(), "src/content/copy-baseline.json");

async function readMap(blobKey: string, localFile: string): Promise<CopyMap> {
  try {
    let raw: string | null = null;
    if (blobsEnabled()) {
      const s = await store("copy");
      raw = (await s.get(blobKey, { type: "text" })) ?? null;
    } else if (fs.existsSync(localFile)) {
      raw = fs.readFileSync(localFile, "utf8");
    }
    if (raw) {
      const parsed = JSON.parse(raw) as CopyMap;
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    // fall through to empty
  }
  return {};
}

async function writeMap(blobKey: string, localFile: string, map: CopyMap): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("copy");
    await s.setJSON(blobKey, map);
  } else {
    fs.mkdirSync(path.dirname(localFile), { recursive: true });
    fs.writeFileSync(localFile, JSON.stringify(map, null, 2));
  }
}

async function deleteMap(blobKey: string, localFile: string): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("copy");
    await s.delete(blobKey);
  } else if (fs.existsSync(localFile)) {
    fs.unlinkSync(localFile);
  }
}

const readOverrides = () => readMap(OVERRIDES_KEY, LOCAL_OVERRIDES);
const readBaseline = () => readMap(BASELINE_KEY, LOCAL_BASELINE);

/** The default a field falls back to: the pinned baseline if set, else code. */
function effectiveDefault(id: string, baseline: CopyMap): string {
  const b = baseline[id];
  if (typeof b === "string" && b.trim()) return b;
  return copyDefaults[id]?.text ?? "";
}

/** id -> current text (override, else baseline, else the repo default). */
export async function getCopy(): Promise<CopyMap> {
  const [overrides, baseline] = await Promise.all([readOverrides(), readBaseline()]);
  const out: CopyMap = {};
  for (const [id] of Object.entries(copyDefaults)) {
    const o = overrides[id];
    out[id] = typeof o === "string" && o.trim() ? o : effectiveDefault(id, baseline);
  }
  return out;
}

/** True when a pinned baseline exists (so "revert" returns to your edits). */
export async function hasBaseline(): Promise<boolean> {
  const b = await readBaseline();
  return Object.keys(b).length > 0;
}

/** Persist texts as overrides; entries equal to the current default are dropped. */
export async function saveCopy(texts: CopyMap): Promise<void> {
  const baseline = await readBaseline();
  const overrides: CopyMap = {};
  for (const [id] of Object.entries(copyDefaults)) {
    const t = texts[id];
    if (typeof t === "string" && t.trim() && t !== effectiveDefault(id, baseline)) overrides[id] = t;
  }
  await writeMap(OVERRIDES_KEY, LOCAL_OVERRIDES, overrides);
}

/**
 * Pin the current edits as the new default. After this, reverting comes back
 * here instead of the repo code. Scope to `ids` to promote only some blocks
 * (e.g. one page); omit for the whole site.
 */
export async function promoteBaseline(ids?: string[]): Promise<void> {
  const current = await getCopy();
  const baseline = await readBaseline();
  const overrides = await readOverrides();
  const scope = ids && ids.length ? ids : Object.keys(copyDefaults);
  for (const id of scope) {
    if (!(id in copyDefaults)) continue;
    const val = current[id];
    // keep the baseline sparse: only store what differs from the repo default
    if (typeof val === "string" && val.trim() && val !== copyDefaults[id].text) {
      baseline[id] = val;
    } else {
      delete baseline[id];
    }
    // the promoted value is now the default, so drop any live override for it
    delete overrides[id];
  }
  await Promise.all([
    writeMap(BASELINE_KEY, LOCAL_BASELINE, baseline),
    writeMap(OVERRIDES_KEY, LOCAL_OVERRIDES, overrides),
  ]);
}

/** Revert overrides so fields fall back to the default (baseline, else code). */
export async function clearCopy(ids?: string[]): Promise<void> {
  if (!ids || !ids.length) {
    await deleteMap(OVERRIDES_KEY, LOCAL_OVERRIDES);
    return;
  }
  const overrides = await readOverrides();
  for (const id of ids) delete overrides[id];
  await writeMap(OVERRIDES_KEY, LOCAL_OVERRIDES, overrides);
}

/** Wipe both overrides and the pinned baseline: back to the repo code. */
export async function resetCopyToCode(): Promise<void> {
  await Promise.all([
    deleteMap(OVERRIDES_KEY, LOCAL_OVERRIDES),
    deleteMap(BASELINE_KEY, LOCAL_BASELINE),
  ]);
}
