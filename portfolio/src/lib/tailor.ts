// Reads a job description and answers it with her own material.
//
// The role buttons are a guess at what someone wants; a pasted job description
// is the thing itself. So it does two jobs at once: rank the projects by how
// close they actually are to the posting (the description is just a very long
// search query, and the project vectors are already cached), and pull the parts
// of the resume that answer it.
//
// The resume half is selection, never invention. The model is given her real
// sections and asked which entries and which bullets matter for this posting,
// returning them by index. Anything it returns that is not an index we
// recognise is dropped, so it cannot write a job she never had.

import OpenAI from "openai";
import { searchProjects, type SearchHit } from "@/lib/search";
import { categorizeAll, getAllProjects } from "@/lib/github-projects";
import { richToText } from "@/lib/richHtml";
import { getResumeTex } from "@/lib/resumeSource";
import { parseResumeTex } from "@/lib/resumeTex";

/** Long enough for a real posting, short enough to stay cheap. */
export const MAX_JD = 6000;

export interface TailoredEntry {
  section: string;
  title: string;
  meta: string;
  bullets: string[];
}

export interface Tailored {
  /** two or three sentences on the fit, drawn only from the resume */
  summary: string;
  /** the entries worth reading for this posting, strongest first */
  entries: TailoredEntry[];
  /** her skills that the posting actually asks for */
  skills: string[];
  /** what the posting asks for that the resume does not evidence */
  gaps: string[];
  projects: SearchHit[];
}

const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'", "#x27": "'",
};

// tags out, entities back to characters: the resume is parsed to HTML on the way
// here, so "Clinical LLM &amp; Phenotyping" would otherwise reach the page raw
const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&([a-z]+|#x?[0-9a-f]+);/gi, (m, e) => ENTITIES[e.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();


/**
 * Everything she can truthfully claim, as one searchable blob: the resume, and
 * the projects she wrote up.
 */
function evidenceOf(flat: TailoredEntry[], skillLines: string[], projects: string[]): string {
  return [
    ...flat.map((e) => `${e.title} ${e.meta} ${e.bullets.join(" ")}`),
    ...skillLines,
    ...projects,
  ]
    .join(" ")
    .toLowerCase();
}

const STOP = new Set(["and", "or", "with", "the", "a", "an", "of", "in", "for", "experience"]);

/**
 * Keep only the skills her material actually shows.
 *
 * Asked for "the skills the posting asks for that the resume evidences", the
 * model handed back Swift, SwiftUI, Core Data and UIKit for an iOS posting: it
 * had listed the posting's requirements, not her skills. On a portfolio that is
 * not a rough edge, it is a lie told to a recruiter in her name. So the claim is
 * checked rather than requested: a skill survives only if the words that carry
 * its meaning appear in her own material.
 *
 * Word boundaries matter on both sides. A leading boundary alone let "Swift"
 * through on the strength of "Hey Swiftie: Emotion Verse", which is exactly the
 * claim it was supposed to stop. A trailing boundary with an optional plural
 * keeps "model" matching "models" without letting a prefix match anything.
 */
function keepEvidenced(skills: string[], evidence: string): string[] {
  return skills.filter((skill) => {
    const words = skill
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .filter((w) => w.length > 1 && !STOP.has(w));
    if (!words.length) return false;
    const seen = words.filter((w) => {
      const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b${esc}(?:s|es)?\\b`, "i").test(evidence);
    });
    // most of what the skill is made of has to be there, so "GPU inference
    // optimisation" survives on her material while "Core Data" does not
    return seen.length / words.length >= 0.6;
  });
}

export async function tailorTo(jd: string): Promise<Tailored> {
  const posting = jd.slice(0, MAX_JD);

  const [tex, allProjects] = await Promise.all([getResumeTex(), getAllProjects()]);
  const sections = parseResumeTex(tex);

  // The projects she wrote up, as evidence the resume itself does not carry.
  // Without them the gap check called "retrieval systems" a gap for someone
  // with three retrieval projects, because the resume does not use that phrase.
  const written = allProjects
    .filter((p) => p.curated)
    .map((p) => `${p.name}: ${richToText(p.blurb, 180)}`);

  // Flattened and numbered, because the model answers with indices. It cannot
  // hand back an entry that does not exist.
  const flat: TailoredEntry[] = [];
  for (const s of sections) {
    for (const e of s.entries) {
      flat.push({
        section: strip(s.title),
        title: strip(e.left),
        meta: [strip(e.subLeft ?? ""), strip(e.right), strip(e.subRight ?? "")]
          .filter(Boolean)
          .join(" · "),
        bullets: e.bullets.map(strip).filter(Boolean),
      });
    }
  }
  const skillLines = sections.flatMap((s) => s.lines.map(strip)).filter(Boolean);

  if (!process.env.OPENAI_API_KEY || !flat.length) {
    return { summary: "", entries: [], skills: [], gaps: [], projects: [] };
  }

  const openai = new OpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You are given a job posting and a candidate's real resume, already parsed into numbered entries.",
          "Choose the entries that answer this posting, strongest first, at most five. For each, choose which of its bullets are worth reading here, by index, at most three, in the order they should be read.",
          "summary: two or three sentences on why this candidate fits this posting. Every claim must come from the material given, and if the fit is weak, say so plainly rather than stretching: a recruiter can tell, and a page that oversells is worth less than one that is straight with them. Do not describe the posting back, and do not use the words 'passionate', 'leveraging', 'seamless' or 'proven track record'.",
          "skills: the skills the posting asks for that the resume actually evidences, drawn from the skills lines given. At most ten, each one or two words. Never list a skill the resume does not show.",
          "focus: the posting reduced to the technical work it is actually about, as a dense line of at most 25 words: the methods, the technologies, the domain. No company boilerplate, no 'you will', no benefits, no nice-to-haves.",
          "gaps: up to three things the posting asks for that neither the resume entries nor the project list evidence, each two to five words. Check the projects before calling something a gap: a posting asking for retrieval systems is not a gap for someone with three retrieval projects. Be honest and specific, and return an empty list if the material really covers everything.",
          "Never invent an entry, a bullet, a skill or a number. You are selecting from what you were given, not writing.",
          "No em dashes or en dashes.",
          'Return JSON {"focus": "...", "summary": "...", "picks": [{"entry": 0, "bullets": [0, 2]}], "skills": ["..."], "gaps": ["..."]}.',
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          posting,
          projects: written,
          entries: flat.map((e, i) => ({
            i,
            section: e.section,
            title: e.title,
            meta: e.meta,
            bullets: e.bullets.map((b, j) => ({ j, text: b })),
          })),
          skillLines,
        }),
      },
    ],
  });

  try {
    const o = JSON.parse(res.choices[0]?.message?.content ?? "{}") as {
      focus?: unknown;
      summary?: unknown;
      picks?: unknown;
      skills?: unknown;
      gaps?: unknown;
    };
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const list = (v: unknown, n: number) =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && !!x.trim()).slice(0, n) : [];

    const entries: TailoredEntry[] = [];
    if (Array.isArray(o.picks)) {
      for (const raw of o.picks.slice(0, 5)) {
        const p = raw as { entry?: unknown; bullets?: unknown };
        const src = typeof p.entry === "number" ? flat[p.entry] : undefined;
        // an index we do not recognise is a hallucinated entry: drop it
        if (!src) continue;
        const idx = Array.isArray(p.bullets)
          ? p.bullets.filter((b): b is number => typeof b === "number")
          : [];
        const bullets = idx.map((j) => src.bullets[j]).filter(Boolean).slice(0, 3);
        entries.push({ ...src, bullets: bullets.length ? bullets : src.bullets.slice(0, 2) });
      }
    }

    // Embedding the whole posting does not work. A long posting averages out to
    // a blur: the scores bunched between 0.42 and 0.50 and her flagship clinical
    // work ranked below a loan-status exercise for a clinical AI job. The same
    // posting reduced to its technical line ranks properly, so the search runs
    // on that instead, after the model has read it. Costs about a second, and is
    // the difference between useful and not.
    const focus = str(o.focus) || posting;
    const ranked = await searchProjects(focus, 40);
    // the areas the posting names are a sharper signal than its overall drift,
    // read by the same keyword classifier that files the repos
    const wanted = new Set(categorizeAll(focus, 6));
    const nudge = (h: SearchHit) =>
      h.score +
      (h.categories ?? []).filter((c) => wanted.has(c as never)).length * 0.05 +
      (h.curated ? 0.03 : 0);
    const projects = [...ranked].sort((a, b) => nudge(b) - nudge(a)).slice(0, 6);

    return {
      summary: str(o.summary),
      entries,
      // checked against her own material, never taken on the model's word
      skills: keepEvidenced(list(o.skills, 14), evidenceOf(flat, skillLines, written)).slice(0, 10),
      gaps: list(o.gaps, 3),
      projects,
    };
  } catch {
    return { summary: "", entries: [], skills: [], gaps: [], projects: [] };
  }
}
