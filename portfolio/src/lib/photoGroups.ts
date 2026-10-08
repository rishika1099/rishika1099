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
  /** a few thumbnails of each group (base64 JPEG), by group number */
  samples?: Record<string, string[]>;
}

const NAMING = [
  "These photos were grouped together because they look alike. Name what they share, as a heading for a photo gallery.",
  "One to three lowercase words, concrete and specific: the subject, the place or the light. Good: skylines by day, sunsets over water, mountain air, the city after dark, in bloom.",
  "Name one thing, not a list joined by 'and'.",
  "Not a mood, and no decoration. Never: serene, tranquil, vibrant, brilliance, embrace, beauty, moments, vibes, celebrations, symbols, or anything beginning nature's.",
  "Just the name, no quotes, no period.",
].join(" ");

// A prompt is a request, not a guarantee: told never to, the model still named
// a group "celebrations and symbols". So the rules are checked here, and a name
// that breaks one is sent back once with what it broke.
const VAGUE = /\b(serene|tranquil|vibrant|brilliance|embrace|beauty|beautiful|moments?|vibes?|celebrations?|symbols?|nature's|wonders?|magic|essence)\b/i;
function offence(name: string): string | null {
  const vague = VAGUE.exec(name);
  if (vague) return `it uses "${vague[0]}", which says nothing about what is in the photos`;
  if (/\band\b|&/.test(name)) return "it is a list joined by 'and'; name the one thing they share";
  if (name.split(/\s+/).length > 4) return "it is longer than three words";
  return null;
}

/**
 * A name for one group, from a few of its photos (and their captions, which
 * help with places a thumbnail cannot show). Named from captions alone the
 * groups came out as moods, "serene silhouettes" for a set of monuments,
 * because that is what captions are written as.
 */
async function nameGroup(images: string[], captions: string[], taken: string[], n: number): Promise<string> {
  if (!process.env.OPENAI_API_KEY || (!images.length && !captions.length)) return `group ${n}`;
  const ask = async (extra: string) => {
    const res = await new OpenAI().chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 20,
      messages: [
        { role: "system", content: NAMING },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                [
                  captions.length ? `Their captions:\n${captions.slice(0, 12).join("\n")}` : "",
                  taken.length
                    ? `The other groups are already called: ${taken.join(", ")}. This one must be told apart from them.`
                    : "",
                  extra,
                ]
                  .filter(Boolean)
                  .join("\n\n") || "Name this group.",
            },
            ...images.map((b64) => ({
              type: "image_url" as const,
              image_url: { url: `data:image/jpeg;base64,${b64}`, detail: "low" as const },
            })),
          ],
        },
      ],
    });
    return res.choices[0]?.message?.content?.trim().replace(/^["']|["'.]$/g, "").toLowerCase() ?? "";
  };
  try {
    let name = await ask("");
    const wrong = name ? offence(name) : null;
    if (wrong) {
      const again = await ask(`Your last answer was "${name}". That will not do: ${wrong}. Give a different name.`);
      // a second miss is still better than no name; a clean second answer wins
      if (again && !offence(again)) name = again;
      else if (again && !VAGUE.test(again)) name = again;
    }
    return name || `group ${n}`;
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
    const images = (input.samples?.[g] ?? [])
      .filter((b) => typeof b === "string" && b.length < 200_000)
      .slice(0, 5);
    let label = await nameGroup(images, caps, Object.values(labels), g + 1);
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

/** The groups as the atelier lists them: number, name, how many photos. */
export async function listGroups(): Promise<{ id: string; label: string; count: number }[]> {
  const c = await readClusters();
  if (!c) return [];
  const on = new Set((await listPhotos()).map((p) => p.src.split("/").pop() ?? ""));
  return Object.entries(c.labels)
    .map(([id, label]) => ({
      id,
      label,
      count: Object.entries(c.assignments).filter(([f, g]) => String(g) === id && on.has(f)).length,
    }))
    .filter((g) => g.count > 0)
    .sort((a, b) => b.count - a.count);
}

/**
 * Rename groups by hand. A name given here outlives a regroup the same way any
 * name does: the group that is mostly the same photos keeps it.
 */
export async function renameGroups(names: Record<string, string>): Promise<void> {
  const c = await readClusters();
  if (!c) return;
  for (const [id, raw] of Object.entries(names)) {
    if (!(id in c.labels) || typeof raw !== "string") continue;
    const name = raw.replace(/\s+/g, " ").trim().slice(0, 40);
    if (name) c.labels[id] = name;
  }
  await writeClusters(c);
}
