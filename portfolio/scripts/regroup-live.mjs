#!/usr/bin/env node
/**
 * Regroup the photos that live on the site.
 *
 * A photo uploaded through the site has no group until the grouping has seen
 * it, and the grouping (CLIP, then k-means) is far too heavy for the site to
 * run on itself. So a scheduled job runs it here: it asks the site which
 * photos it has, and if that set differs from the set the current groups were
 * made from, it downloads them, groups all of them together from scratch, and
 * hands the result back. The site names the groups, keeping the name of any
 * group that is mostly the same photos as before.
 *
 *   node scripts/regroup-live.mjs check   say whether anything needs doing
 *   node scripts/regroup-live.mjs run     do it (FORCE=1 to do it regardless)
 *
 * `check` needs nothing installed, so the job can stop there on most hours
 * without downloading a model.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const SITE = process.env.SITE_URL || "https://rishika-m.com";
const TOKEN = process.env.ADMIN_API_TOKEN;
const mode = process.argv[2] === "run" ? "run" : "check";

if (!TOKEN) {
  console.error("ADMIN_API_TOKEN is required: the photo list and the groups are owner-only.");
  process.exit(1);
}

// A connection that drops is tried again. Fifty downloads in a row from a
// runner will lose one now and then, and the first full run on GitHub died on
// exactly that, a single reset among fifty photos.
async function fetchRetry(url, init = {}, tries = 5) {
  for (let n = 1; ; n++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(60000) });
      // the site being briefly busy is worth waiting out; a refusal is not
      if (res.status < 500 || n >= tries) return res;
    } catch (err) {
      if (n >= tries) throw err;
    }
    await new Promise((r) => setTimeout(r, 1500 * n));
  }
}

async function api(route, init = {}) {
  const res = await fetchRetry(`${SITE}${route}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${route}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const { photos } = await api("/api/admin/photos");
// where each photo is served from, by file name
const srcOf = new Map(photos.map((p) => [p.src.split("/").pop(), p.src]));
const files = [...srcOf.keys()].sort();
const current = await api("/api/admin/photos/clusters");
const grouped = new Set(current.files ?? []);

const added = files.filter((f) => !grouped.has(f));
const gone = [...grouped].filter((f) => !files.includes(f));
const changed = files.length >= 4 && (added.length > 0 || gone.length > 0);

console.log(`${files.length} photos on the site; ${grouped.size} in the current groups.`);
if (added.length) console.log(`  not grouped yet: ${added.join(", ")}`);
if (gone.length) console.log(`  grouped but deleted since: ${gone.join(", ")}`);
if (files.length < 4) console.log("  fewer than 4 photos: nothing to group.");

if (mode === "check") {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  console.log(changed ? "The groups are out of date." : "The groups are up to date.");
  process.exit(0);
}

if (!changed && !process.env.FORCE) {
  console.log("The groups are up to date; nothing to do.");
  process.exit(0);
}
if (files.length < 4) process.exit(0);

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "photos-"));
for (const f of files) {
  const res = await fetchRetry(`${SITE}${srcOf.get(f)}`);
  if (!res.ok) throw new Error(`could not download ${f}: HTTP ${res.status}`);
  fs.writeFileSync(path.join(dir, f), Buffer.from(await res.arrayBuffer()));
}
console.log(`Downloaded ${files.length} photos.`);

// imported here, not at the top: `check` runs before anything is installed
const { clusterImages } = await import("./lib/cluster-core.mjs");
const { k, silhouette, scores, assign } = await clusterImages(dir, files);

const assignments = Object.fromEntries(files.map((f, i) => [f, assign[i]]));

// A group is named from what its photos look like, so a few of them travel
// with the grouping, shrunk to thumbnails: enough to see the subject, small
// enough that nine groups of them fit in one request.
const { default: sharp } = await import("sharp");
const samples = {};
for (let c = 0; c < k; c++) {
  const mine = files.filter((_, i) => assign[i] === c);
  // spread across the group, not its first few, which are often one outing
  const step = Math.max(1, Math.floor(mine.length / 5));
  const picked = mine.filter((_, i) => i % step === 0).slice(0, 5);
  samples[c] = [];
  for (const f of picked) {
    const jpeg = await sharp(path.join(dir, f)).rotate().resize(384, 384, { fit: "inside" }).jpeg({ quality: 70 }).toBuffer();
    samples[c].push(jpeg.toString("base64"));
  }
}

const saved = await api("/api/admin/photos/clusters", {
  method: "POST",
  body: JSON.stringify({ k, silhouette, scores, assignments, samples, method: "clip-image" }),
});
for (const [c, label] of Object.entries(saved.labels ?? {})) {
  const n = assign.filter((a) => a === Number(c)).length;
  console.log(`  "${label}" (${n} photos)${saved.kept?.includes(label) ? ", name kept" : ""}`);
}
console.log("✦ the gallery is regrouped, live now.");
fs.rmSync(dir, { recursive: true, force: true });
