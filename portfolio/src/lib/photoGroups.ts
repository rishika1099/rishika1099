// Naming the photo groups, and saving them.
//
// The grouping is done away from the site (scripts/regroup-live.mjs on a
// schedule, or `npm run cluster` on her machine) and arrives here as "this
// file is in group 2". What it does not arrive with is names, and the names
// are the part a visitor reads.
//
// Each regroup starts from scratch, so its group numbers mean nothing from one
// run to the next. A group that is mostly the same photos as an old one keeps
// that old name: otherwise uploading one photo could rename the whole gallery,
// including any name she chose by hand. Only a group that is new gets a new
// name, written from its photos' captions.

import OpenAI from "openai";
import { listPhotos, readClusters, writeClusters, type Clusters } from "@/lib/photos";

export interface Regrouped {
  k: number;
  silhouette: number;
  assignments: Record<string, number>;
  scores?: unknown;
  method?: string;
}

async function nameFromCaptions(captions: string[], n: number): Promise<string> {
  if (!process.env.OPENAI_API_KEY || !captions.length) return `group ${n}`;
  try {
    const res = await new OpenAI().chat.completions.create({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "Give a short lowercase theme title (1 to 3 words) for this group of photo captions. Just the title, no quotes, no period.",
        },
        { role: "user", content: captions.join("\n") },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, "").toLowerCase();
    return text || `group ${n}`;
  } catch {
    return `group ${n}`;
  }
}

/** Save a fresh grouping of the photos now on the site, and name its groups. */
export async function saveRegrouped(
  input: Regrouped,
): Promise<{ labels: Record<string, string>; kept: string[] }> {
  const photos = await listPhotos();
  const caption = new Map(photos.map((p) => [p.src.split("/").pop() ?? "", p.caption]));

  // only photos that exist, only whole group numbers within range
  const assignments: Record<string, number> = {};
  for (const [file, g] of Object.entries(input.assignments)) {
    if (caption.has(file) && Number.isInteger(g) && g >= 0 && g < input.k) assignments[file] = g;
  }

  const old = await readClusters();
  const members = (a: Record<string, number>, g: number) =>
    new Set(Object.entries(a).filter(([, v]) => v === g).map(([f]) => f));

  // every (new group, old group) pair that is mostly the same photos, best first
  const pairs: { g: number; label: string; score: number }[] = [];
  if (old) {
    for (let g = 0; g < input.k; g++) {
      const now = members(assignments, g);
      // judged on the photos both groupings have seen, so new arrivals joining
      // a group do not count against it being the same group
      const known = [...now].filter((f) => f in old.assignments);
      for (const [og, label] of Object.entries(old.labels)) {
        const before = [...members(old.assignments, Number(og))].filter((f) => caption.has(f));
        if (!before.length || !known.length || !label) continue;
        const shared = before.filter((f) => now.has(f)).length;
        const score = Math.min(shared / before.length, shared / known.length);
        if (score >= 0.6) pairs.push({ g, label, score });
      }
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  const labels: Record<string, string> = {};
  const kept: string[] = [];
  for (const p of pairs) {
    if (labels[p.g] !== undefined || kept.includes(p.label)) continue;
    labels[p.g] = p.label;
    kept.push(p.label);
  }

  for (let g = 0; g < input.k; g++) {
    if (labels[g] !== undefined) continue;
    const caps = [...members(assignments, g)].map((f) => caption.get(f) ?? "").filter(Boolean);
    let label = await nameFromCaptions(caps, g + 1);
    // two groups under one name read as a mistake
    if (Object.values(labels).includes(label)) label = `${label} ii`;
    labels[g] = label;
  }

  const next: Clusters & Record<string, unknown> = {
    k: input.k,
    silhouette: input.silhouette,
    method: input.method ?? "clip-image",
    scores: input.scores,
    labels,
    assignments,
  };
  await writeClusters(next);
  return { labels, kept };
}
