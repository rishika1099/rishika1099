// A case study read out of the repo, for the projects that do not have one
// written by hand.
//
// The same bargain as the pipeline diagrams: most projects will never get a
// hand-written deep dive, but their readmes already contain the problem, the
// approach and usually the numbers. So it is drafted once from that material,
// cached, and shown only where nothing authored exists.
//
// An authored case study always wins. This never overwrites one: they live in
// different stores precisely so a generated draft cannot eat something she
// wrote.

import OpenAI from "openai";
import { getAllProjects } from "@/lib/github-projects";
import { getReadmeSnippet } from "@/lib/github-readme";
import { readStore, srcHash, writeStore } from "@/lib/genCache";
import { repoSlug } from "@/lib/projectOverrides";
import { sanitizeRichHtml } from "@/lib/richHtml";
import type { CaseStudy } from "@/lib/caseStudies";

const STORE = "case-studies-auto";

const parse = (text: string, slug: string): CaseStudy | null => {
  try {
    const o = JSON.parse(text) as {
      tagline?: unknown;
      metrics?: unknown;
      problem?: unknown;
      approach?: unknown;
      result?: unknown;
    };
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const problem = str(o.problem);
    const approach = str(o.approach);
    const result = str(o.result);
    // without a problem and an approach there is no case study, only a blurb
    if (!problem || !approach) return null;

    const metrics = Array.isArray(o.metrics)
      ? o.metrics
          .map((m) => m as Record<string, unknown>)
          .filter((m) => m && typeof m === "object")
          .map((m) => ({ label: str(m.label).slice(0, 60), value: str(m.value).slice(0, 40) }))
          .filter((m) => m.label && m.value)
          .slice(0, 4)
      : [];

    const section = (title: string, body: string) =>
      body ? `<h3>${title}</h3><p>${body}</p>` : "";

    return {
      slug,
      tagline: str(o.tagline).slice(0, 240),
      metrics,
      body: sanitizeRichHtml(
        section("The problem", problem) +
          section("How it works", approach) +
          section("What it found", result),
      ),
    };
  } catch {
    return null;
  }
};

/** The cached draft for one project, or null. Never generates. */
export async function getAutoCaseStudy(slug: string): Promise<CaseStudy | null> {
  const all = await readStore(STORE);
  const hit = all[slug];
  return hit ? parse(hit.text, slug) : null;
}

/** Draft one from the repo, once. */
export async function buildAutoCaseStudy(slug: string): Promise<CaseStudy | null> {
  const projects = await getAllProjects();
  const project = projects.find((p) => repoSlug(p.repo) === slug);
  if (!project) return null;

  const readme = await getReadmeSnippet(project.repo, 4000);
  const source = srcHash(`${project.blurb}|${readme}`);

  const all = await readStore(STORE);
  if (all[slug]?.src === source) return parse(all[slug].text, slug);
  if (!readme.trim() || !process.env.OPENAI_API_KEY) return null;

  const openai = new OpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "Write a short case study of this project from its readme, for a recruiter who has thirty seconds.",
          "problem: two sentences on what was hard, and why it needed doing. approach: two or three sentences on how it works, naming the actual methods and tools. result: one or two sentences on what it measured or achieved, or an empty string if the readme reports nothing.",
          "tagline: one sentence, under twenty words, saying what the project is.",
          "metrics: up to four headline numbers the readme actually states, each a short value like \"85.1%\" or \"1.93x\" with a two or three word label. An empty list if it states none. Never estimate, round up, or invent a number.",
          "Everything must come from the material given. Do not invent a motivation, a technique, or a result. If the readme is too thin for a real case study, return empty strings.",
          "Third person about the work. No em dashes or en dashes. No consultant filler: no enhancing, empowering, leveraging, seamless, robust solution, cutting-edge.",
          'Return JSON {"tagline": "...", "metrics": [{"label": "...", "value": "..."}], "problem": "...", "approach": "...", "result": "..."}.',
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          name: project.name,
          blurb: project.blurb,
          areas: project.categories,
          readme,
        }),
      },
    ],
  });

  const text = res.choices[0]?.message?.content ?? "{}";
  const parsed = parse(text, slug);
  // the empty answer is cached too, so a thin readme is only paid for once
  await writeStore(STORE, { ...all, [slug]: { src: source, text: parsed ? text : "{}" } });
  return parsed;
}
