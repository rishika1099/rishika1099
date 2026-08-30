// LinkedIn-style editing for the About page: entries edited in the secret
// /edit room are stored as overrides (Netlify Blobs on deploy, a gitignored
// local file in dev) and win over the repo defaults at render time, so an
// edit goes live instantly with no rebuild.

import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";
import {
  certifications as repoCertifications,
  education as repoEducation,
  timeline as repoTimeline,
  type Entry,
} from "@/data/about";

export interface AboutEntries {
  education: Entry[];
  timeline: Entry[];
  // short courses / nanodegrees / certifications (added later; older overrides
  // won't have it, so it's normalized to [] on read)
  certifications: Entry[];
}

const KEY = "overrides";
// A pinned snapshot that "revert" comes back to, the same three-layer model the
// page copy already uses: override wins over baseline wins over the repo code.
// Without it, reverting dropped straight to src/data/about.ts, where
// certifications is an empty array, so one revert erased the whole section.
const BASELINE_KEY = "baseline";
const LOCAL_FILE = path.join(process.cwd(), "src/content/about-overrides.json");
const LOCAL_BASELINE = path.join(process.cwd(), "src/content/about-baseline.json");

// only education + timeline are required; certifications is optional for
// backward compatibility with overrides saved before it existed
function sane(v: unknown): v is { education: Entry[]; timeline: Entry[]; certifications?: Entry[] } {
  const o = v as AboutEntries;
  return !!o && Array.isArray(o.education) && Array.isArray(o.timeline);
}

async function read(blobKey: string, localFile: string): Promise<AboutEntries | null> {
  try {
    let raw: string | null = null;
    if (blobsEnabled()) {
      const s = await store("about");
      raw = (await s.get(blobKey, { type: "text" })) ?? null;
    } else if (fs.existsSync(localFile)) {
      raw = fs.readFileSync(localFile, "utf8");
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (sane(parsed)) {
        return {
          education: parsed.education,
          timeline: parsed.timeline,
          certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
        };
      }
    }
  } catch {
    // fall through to the next layer
  }
  return null;
}

/** What the page renders: your edits, else the pinned default, else the code. */
export async function getAboutEntries(): Promise<AboutEntries> {
  return (
    (await read(KEY, LOCAL_FILE)) ??
    (await read(BASELINE_KEY, LOCAL_BASELINE)) ??
    { education: repoEducation, timeline: repoTimeline, certifications: repoCertifications }
  );
}

/** What "revert" comes back to. */
export async function getAboutDefaults(): Promise<AboutEntries> {
  return (
    (await read(BASELINE_KEY, LOCAL_BASELINE)) ??
    { education: repoEducation, timeline: repoTimeline, certifications: repoCertifications }
  );
}

/** Pin what is on the page now, so a later revert lands here and not on the code. */
export async function promoteAboutBaseline(): Promise<void> {
  const current = await getAboutEntries();
  if (blobsEnabled()) {
    const s = await store("about");
    await s.setJSON(BASELINE_KEY, current);
  } else {
    fs.writeFileSync(LOCAL_BASELINE, JSON.stringify(current, null, 2));
  }
}

export async function saveAboutEntries(data: AboutEntries): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("about");
    await s.setJSON(KEY, data);
  } else {
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(data, null, 2));
  }
}

export async function clearAboutEntries(): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("about");
    await s.delete(KEY);
  } else if (fs.existsSync(LOCAL_FILE)) {
    fs.unlinkSync(LOCAL_FILE);
  }
}
