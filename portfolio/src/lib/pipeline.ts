// A picture of how a project actually works, drawn rather than uploaded.
//
// Every project card has room for an image, and most projects will never get a
// hand-made one: taking a screenshot of ninety-eight repos is not a thing that
// happens. But a readme usually describes a pipeline, and a pipeline draws
// well. So the steps are read out of the readme once, cached like every other
// generated thing, and rendered as a small diagram in the site's own colours.
//
// It is a fallback, not a replacement. An uploaded screenshot always wins.

import OpenAI from "openai";
import { getAllProjects } from "@/lib/github-projects";
import { getReadmeSnippet } from "@/lib/github-readme";
import { readStore, srcHash, writeStore } from "@/lib/genCache";
import { repoSlug } from "@/lib/projectOverrides";

const STORE = "pipelines";

export interface Pipeline {
  /** three to six stages, in order, each a couple of words */
  steps: string[];
}

const parse = (text: string): Pipeline | null => {
  try {
    const o = JSON.parse(text) as { steps?: unknown };
    const steps = Array.isArray(o.steps)
      ? o.steps.filter((s): s is string => typeof s === "string").map((s) => s.trim()).filter(Boolean)
      : [];
    // fewer than two boxes is not a pipeline, and more than six stops being
    // readable at card width
    return steps.length >= 2 ? { steps: steps.slice(0, 6) } : null;
  } catch {
    return null;
  }
};

/** The cached pipeline for one project, or null if there is nothing to draw. */
export async function getPipeline(slug: string): Promise<Pipeline | null> {
  const all = await readStore(STORE);
  const hit = all[slug];
  return hit ? parse(hit.text) : null;
}

/**
 * Read the steps out of a project's readme, once.
 *
 * Returns null when the readme does not describe a pipeline, and caches that
 * answer too: a project with a two-line readme should be asked once, not on
 * every request forever.
 */
export async function buildPipeline(slug: string): Promise<Pipeline | null> {
  const projects = await getAllProjects();
  const project = projects.find((p) => repoSlug(p.repo) === slug);
  if (!project) return null;

  const readme = await getReadmeSnippet(project.repo, 3000);
  const source = srcHash(`${project.blurb}|${readme}`);

  const all = await readStore(STORE);
  if (all[slug]?.src === source) return parse(all[slug].text);
  if (!readme.trim()) return null;
  if (!process.env.OPENAI_API_KEY) return null;

  const openai = new OpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "Read the project and name the stages its data or its request actually passes through, in order.",
          "Three to five stages. Each is one to three words naming a step, not a sentence: \"PDF ingest\", \"Chunk + embed\", \"Retrieve\", \"LLM answer\".",
          "Only stages the material actually supports. If it does not describe a pipeline, or you would have to guess, return an empty list rather than inventing a plausible one.",
          'Return JSON of the shape {"steps": ["...", "..."]}.',
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({ name: project.name, blurb: project.blurb, readme }),
      },
    ],
  });

  const text = res.choices[0]?.message?.content ?? "{}";
  const parsed = parse(text);
  // the empty answer is cached too, so a readme with no pipeline in it is only
  // ever paid for once
  await writeStore(STORE, { ...all, [slug]: { src: source, text: parsed ? text : '{"steps":[]}' } });
  return parsed;
}
