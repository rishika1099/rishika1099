#!/usr/bin/env node
// Snapshot everything the site keeps in Netlify Blobs. That store is the only
// copy: nothing here lives in git, so a bad write or a lost account would take
// the poems with it.
//
// Pulls the editable content export, plus the two things it leaves out (the
// project overrides and the LaTeX résumé), into one JSON file. The workflow
// encrypts that file before committing, because this repo is public and the
// poems are deliberately gated.
//
// Not yet covered: the photo and poem-art image bytes. Those are large and
// regenerable/re-uploadable; the writing is what can't be recreated.

import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

const SITE = process.env.SITE_URL || "https://rishika-m.com";
const KEY = process.env.ADMIN_KEY;
const OUT = process.env.BACKUP_OUT || "/tmp/portfolio-backup.json";
const HASH_OUT = process.env.BACKUP_HASH_OUT || "backups/.content-sha256";

if (!KEY) {
  console.error("ADMIN_KEY is required (the export endpoints are key-gated).");
  process.exit(1);
}

async function grab(path, label) {
  const res = await fetch(`${SITE}${path}`, { headers: { "x-admin-key": KEY } });
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`);
  const text = await res.text();
  console.log(`  ${label}: ${(text.length / 1024).toFixed(1)} KB`);
  return JSON.parse(text);
}

const snapshot = {
  backedUpAt: new Date().toISOString(),
  site: SITE,
};

console.log("Collecting:");
snapshot.content = await grab("/api/admin/export", "content export");
snapshot.projectOverrides = await grab("/api/admin/projects", "project overrides");
snapshot.resumeTex = await grab("/api/admin/resume-tex", "résumé source");

// a quick census, so a shrinking backup is obvious in the commit diff
const counts = {
  copyBlocks: Object.keys(snapshot.content.copy ?? {}).length,
  poems: (snapshot.content.poems ?? []).length,
  photos: (snapshot.content.photos ?? []).length,
  guestbook: (snapshot.content.guestbook ?? []).length,
  blogs: (snapshot.content.blogs ?? []).length,
  projects: (snapshot.projectOverrides.projects ?? []).length,
  resumeChars: (snapshot.resumeTex.tex ?? "").length,
};
snapshot.counts = counts;

if (!counts.poems || !counts.copyBlocks) {
  console.error("Refusing to write a backup that is missing poems or copy.");
  process.exit(1);
}

// A fingerprint of the content, so the workflow can tell a week where nothing
// was written from a week where something was. The encrypted file cannot answer
// that question: openssl salts at random, so identical content encrypts
// differently every run and every run looked like a change. The timestamp is
// left out for the same reason. A hash and not the content, because this file
// is committed to a public repository.
// Both timestamps come out: this one, and the one the export endpoint stamps
// on its own answer. With either left in, every run produced a different
// fingerprint and the check below would have committed every week regardless,
// which is the thing it exists to stop.
const { backedUpAt: _when, ...rest } = snapshot;
const { exportedAt: _exported, ...contentOnly } = rest.content ?? {};
const fingerprint = createHash("sha256")
  .update(JSON.stringify({ ...rest, content: contentOnly }))
  .digest("hex");
writeFileSync(HASH_OUT, `${fingerprint}\n`);
console.log(`Content fingerprint: ${fingerprint.slice(0, 16)}...`);

writeFileSync(OUT, JSON.stringify(snapshot, null, 2));
console.log("\nCensus:", JSON.stringify(counts));
console.log(`Wrote ${OUT}`);
