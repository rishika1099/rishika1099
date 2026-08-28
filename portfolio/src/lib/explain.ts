import { createHash } from "node:crypto";
import OpenAI from "openai";
import { richToText } from "@/lib/richHtml";
import { getAllProjects } from "@/lib/github-projects";
import { blobsEnabled, store } from "@/lib/blobs";

export type Level = "eli5" | "expert";

const AUDIENCE: Record<Level, string> = {
  eli5: "a curious 10-year-old: simple everyday words, no jargon or acronyms, warm and playful, one or two short sentences each",
  expert:
    "a senior ML engineer or technical recruiter: precise and concrete, name the methods, models, and any metrics, no fluff, one or two sentences each",
};

// Rewrites are cached per (project set, level): one LLM call per level, ever.
//
// The in-process Map alone was not enough. Each serverless instance starts with
// an empty one, so most visitors were paying the full rewrite: ~27s of waiting
// after clicking a toggle, and a fresh API bill each time. Persisting to Blobs
// makes it computed once and instant thereafter, the same way poem art works.
// The key includes a hash of the project set, so publishing a repo invalidates
// it on its own rather than serving a stale list.
const cache = new Map<string, Record<string, string>>();

const blobKey = (level: Level, sig: string) => `explain-${level}-${sig}`;

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

  const openai = new OpenAI();
  const list = projects.map((p) => ({ name: p.name, blurb: richToText(p.blurb) }));

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Rewrite each project description for the given audience. Keep every fact truthful, do not invent details. Do not use em dashes or en dashes. Return JSON of the exact shape {\"rewrites\": {\"<project name>\": \"<new description>\"}} using the project names verbatim as keys.",
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
      for (const [k, v] of Object.entries(parsed.rewrites)) {
        if (typeof v === "string") out[k] = v;
      }
    }
  } catch {
    out = {};
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
