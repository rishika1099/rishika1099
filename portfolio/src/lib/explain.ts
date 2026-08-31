import { createHash } from "node:crypto";
import OpenAI from "openai";
import { richToText } from "@/lib/richHtml";
import { getAllProjects, reposAreComplete } from "@/lib/github-projects";
import { getReadmeSnippet } from "@/lib/github-readme";
import { blobsEnabled, store } from "@/lib/blobs";

export type Level = "default" | "eli5" | "expert";

const AUDIENCE: Record<Level, string> = {
  default:
    "the same reader the original was written for. Keep the author's voice, framing and vocabulary exactly; you are not rewriting it, you are continuing it with detail it already implies. Keep the original's grammatical shape: these open with a noun phrase naming the thing (\"An intruder-detection system fusing...\") or a past-tense verb (\"Benchmarked KIVI quantization...\"), never with \"X is a...\"",
  eli5: "a curious 10-year-old: simple everyday words, no jargon or acronyms, warm and playful",
  expert:
    "a senior ML engineer or technical recruiter: precise and concrete, name the methods, models, and any metrics, no fluff",
};

// Cards in a shelf are all as tall as the wordiest one, so a short description
// leaves a hole above the buttons. Rather than shrink the card, every
// description is written to the length of the longest, which is the one setting
// the height: same line count, no hole. The floor keeps a card that genuinely
// has little to say from being padded up to the target with nothing.
const MIN_TARGET = 150;
const MAX_TARGET = 340;

// Rewrites are cached per (project set, level): one LLM call per level, ever.
//
// The in-process Map alone was not enough. Each serverless instance starts with
// an empty one, so most visitors were paying the full rewrite: ~27s of waiting
// after clicking a toggle, and a fresh API bill each time. Persisting to Blobs
// makes it computed once and instant thereafter, the same way poem art works.
// The key includes a hash of the project set, so publishing a repo invalidates
// it on its own rather than serving a stale list.
const cache = new Map<string, Record<string, string>>();

// v2: descriptions are now written to a shared target length. A v1 entry holds
// the short ones, so it must not be served.
const blobKey = (level: Level, sig: string) => `explain-v2-${level}-${sig}`;

async function readCached(level: Level, sig: string): Promise<Record<string, string> | null> {
  const local = cache.get(blobKey(level, sig));
  if (local) return local;
  if (!blobsEnabled()) return null;
  try {
    const s = await store("explain");
    const raw = (await s.get(blobKey(level, sig), { type: "json" })) as Record<string, string> | null;
    if (raw && Object.keys(raw).length) {
      cache.set(blobKey(level, sig), raw);
      return raw;
    }
  } catch {
    // a cache miss must never break the toggle
  }
  return null;
}

export async function explainProjects(level: Level): Promise<Record<string, string>> {
  const projects = await getAllProjects();
  const sig = createHash("sha1").update(projects.map((p) => p.name).join("|")).digest("hex").slice(0, 12);
  const hit = await readCached(level, sig);
  if (hit) return hit;

  // Never buy a rewrite of a list we know is short. When GitHub does not answer
  // the set collapses to the curated projects, which hashes to its own key: the
  // rewrite would be paid for, cached under a signature nothing else uses, and
  // paid for again as soon as the full list returns. The cards simply keep the
  // original blurbs until then.
  if (!reposAreComplete()) return {};

  const openai = new OpenAI();

  // The material the expansion is allowed to draw on. Without it the model has
  // only the blurb it is being asked to lengthen, and padding a sentence with
  // nothing to add is exactly the gibberish this is meant to avoid.
  const readmes = await Promise.all(projects.map((p) => getReadmeSnippet(p.repo, 900)));
  const list = projects.map((p, i) => ({
    name: p.name,
    blurb: richToText(p.blurb),
    tags: p.tags,
    areas: p.categories,
    domains: p.domains ?? [],
    readme: readmes[i] || "",
  }));

  // the description already setting the height of every card
  const target = Math.min(
    MAX_TARGET,
    Math.max(MIN_TARGET, ...list.map((x) => x.blurb.length)),
  );

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          [
            "Rewrite each project description for the given audience.",
            `Every description must be between ${Math.round(target * 0.92)} and ${target} characters. This is a hard ceiling as well as a floor: they sit in a row of equal-height cards, so a short one leaves its card visibly empty and a long one makes every card in the row taller. Count before you answer.`,
            "Reach that length with real detail drawn from the project's own readme, tags, areas and domains: what it actually does, what it is built with, what it found. Never pad with filler, restatement, or adjectives, and never invent a fact that is not in the material you were given. If a project genuinely has too little material, leave it short rather than making something up.",
            "Keep every fact truthful. Do not use em dashes or en dashes.",
            "These describe one person's own projects on her portfolio. Write in the third person about the work itself: never \"the team\", \"we\", or \"I\", and never address the reader as \"you\" or \"your\".",
            "Return JSON of the exact shape {\"rewrites\": {\"<project name>\": \"<new description>\"}} using the project names verbatim as keys.",
          ].join(" "),
      },
      {
        role: "user",
        content: `Audience: ${AUDIENCE[level]}\n\nProjects:\n${JSON.stringify(list)}`,
      },
    ],
  });

  let out: Record<string, string> = {};
  try {
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
    if (parsed.rewrites && typeof parsed.rewrites === "object") {
      const ceiling = Math.round(target * 1.15);
      for (const [k, v] of Object.entries(parsed.rewrites)) {
        // A rewrite that ignored the ceiling would set the height for every
        // card in the row, which is the problem this exists to solve. Counting
        // characters is not something the model reliably does, so the limit is
        // enforced here too: past it, her own wording stands.
        if (typeof v === "string" && v.length <= ceiling) out[k] = v;
      }
    }
  } catch {
    out = {};
  }

  // Second pass: the gap, measured. The first call is told the target, but a
  // project whose readme is thin is told to stay short rather than invent, so
  // it comes back well under and its card still ends in space. Those are the
  // only ones asked again, with a much larger slice of the readme to draw on.
  // One extra call, only when it is needed, and cached with the rest.
  const short = list.filter((x) => {
    const got = out[x.name];
    return got && got.length < target * 0.85;
  });
  if (short.length) {
    try {
      const deeper = await Promise.all(short.map((x) => getReadmeSnippet(projects.find((p) => p.name === x.name)!.repo, 3000)));
      const again = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              [
                "Each of these descriptions came back shorter than its card needs, leaving the card visibly empty under the text.",
                `Extend each one to between ${Math.round(target * 0.92)} and ${target} characters using the fuller readme now provided: name what it actually does, what it is built with, and what it measured or found. Do not exceed ${target}.`,
                "Do not pad, restate, or add adjectives, and do not invent anything absent from the readme. If the readme still does not support the length, return the description unchanged rather than making something up.",
                "Keep the existing wording and voice, and keep extending in it. Third person, no \"the team\", \"we\", or \"you\". No em dashes or en dashes.",
                "Return JSON {\"rewrites\": {\"<project name>\": \"<new description>\"}} with the names verbatim.",
              ].join(" "),
          },
          {
            role: "user",
            content: `Audience: ${AUDIENCE[level]}\n\nProjects:\n${JSON.stringify(
              short.map((x, i) => ({
                name: x.name,
                current: out[x.name],
                currentLength: out[x.name].length,
                targetLength: target,
                tags: x.tags,
                areas: x.areas,
                readme: deeper[i] || x.readme,
              })),
            )}`,
          },
        ],
      });
      const parsed2 = JSON.parse(again.choices[0]?.message?.content ?? "{}");
      if (parsed2.rewrites && typeof parsed2.rewrites === "object") {
        for (const [k, v] of Object.entries(parsed2.rewrites)) {
          // only ever accept a longer one: the top-up must not shrink a card
          if (
            typeof v === "string" &&
            out[k] &&
            v.length > out[k].length &&
            v.length <= Math.round(target * 1.15)
          )
            out[k] = v;
        }
      }
    } catch {
      // the first pass already produced usable text; a failed top-up just
      // leaves the shortest cards as they were
    }
  }

  cache.set(blobKey(level, sig), out);
  if (blobsEnabled() && Object.keys(out).length) {
    try {
      const s = await store("explain");
      await s.setJSON(blobKey(level, sig), out);
    } catch {
      // still fine, it just costs the next instance a rewrite
    }
  }
  return out;
}
