import OpenAI from "openai";
import { richToText } from "@/lib/richHtml";
import { getAllProjects } from "@/lib/github-projects";

export type Level = "eli5" | "expert";

const AUDIENCE: Record<Level, string> = {
  eli5: "a curious 10-year-old: simple everyday words, no jargon or acronyms, warm and playful, one or two short sentences each",
  expert:
    "a senior ML engineer or technical recruiter: precise and concrete, name the methods, models, and any metrics, no fluff, one or two sentences each",
};

// Cache rewrites per (project set, level) so each level costs one LLM call.
const cache = new Map<string, Record<string, string>>();

export async function explainProjects(level: Level): Promise<Record<string, string>> {
  const projects = await getAllProjects();
  const key = `${level}:${projects.map((p) => p.name).join("|")}`;
  const hit = cache.get(key);
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

  cache.set(key, out);
  return out;
}
