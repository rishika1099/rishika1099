// Re-angles her experience toward what someone is hiring for.
//
// Her human-rights LLM research has no healthcare in it, and for a healthcare
// LLM role that reads as irrelevant when it is the closest thing she has done:
// same pipelines, same evaluation problem, different subject. So each entry's
// one-line note is rewritten to lead with the part that answers this particular
// role, out of what the entry already says.
//
// It re-angles, it does not relabel. The rule the prompt is held to is that
// nothing may be added: if the work was not in healthcare it must not sound as
// though it was, and the honest version is "clinical-grade LLM pipelines, on
// human rights data", never "healthcare research". The point is to surface a
// real overlap the reader would otherwise miss, not to manufacture one.

import OpenAI from "openai";
import type { Entry } from "@/data/about";
import { richToText } from "@/lib/richHtml";
import { putStore, readStore, srcHash } from "@/lib/genCache";

const STORE = "angles";

export type Angles = Record<string, string>;

const detailsText = (e: Entry) =>
  Array.isArray(e.details)
    ? e.details.map((d) => richToText(d, 300)).join(" ")
    : richToText(e.details ?? "", 800);

/**
 * Rewrite each entry's note to lead with what this focus is asking for.
 *
 * `cacheKey` is set for the four roles, which are fixed and worth keeping; a
 * pasted posting is unique to one reader and is not cached.
 */
export async function angleEntries(
  entries: Entry[],
  focus: string,
  cacheKey?: string,
): Promise<Angles> {
  if (!process.env.OPENAI_API_KEY || !entries.length || !focus.trim()) return {};

  const items = entries.map((e) => ({
    title: richToText(e.title),
    place: richToText(e.place),
    note: richToText(e.note, 400),
    details: detailsText(e),
    tech: e.tech ?? [],
    domains: e.domains ?? [],
  }));

  const source = srcHash(`${focus}|${items.map((i) => `${i.title}${i.note}`).join("|")}`);
  if (cacheKey) {
    const all = await readStore(STORE);
    const hit = all[cacheKey];
    if (hit?.src === source) {
      try {
        return JSON.parse(hit.text) as Angles;
      } catch {
        // fall through and rebuild
      }
    }
  }

  const openai = new OpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "Someone is hiring for the role described. For each entry, rewrite its one-line note to lead with whatever in that entry answers this role.",
          "Everything must already be in the entry. Never add a domain, a technology, a metric or a claim that is not there. If the work was not in the role's domain, do not let it sound as though it was: the honest angle on human-rights LLM research for a healthcare LLM role is the LLM pipeline and evaluation work, described as what it was, not relabelled as healthcare.",
          "The overlap is usually the method rather than the subject. Lead with the method when the subject does not match, and say what it was applied to.",
          "One or two sentences, 25 to 40 words, in the same plain voice as the original. No em dashes or en dashes. No consultant filler.",
          "If an entry genuinely has nothing to do with this role, return its note unchanged rather than stretching it.",
          'Return JSON {"notes": {"<entry title verbatim>": "<rewritten note>"}} with an entry for every title you were given.',
        ].join(" "),
      },
      { role: "user", content: JSON.stringify({ role: focus, entries: items }) },
    ],
  });

  let out: Angles = {};
  try {
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as { notes?: unknown };
    if (parsed.notes && typeof parsed.notes === "object") {
      const known = new Set(items.map((i) => i.title));
      for (const [k, v] of Object.entries(parsed.notes as Record<string, unknown>)) {
        // a title we do not recognise is an entry it invented
        if (typeof v === "string" && v.trim() && known.has(k)) out[k] = v.trim();
      }
    }
  } catch {
    out = {};
  }

  if (cacheKey && Object.keys(out).length) {
    await putStore(STORE, cacheKey, { src: source, text: JSON.stringify(out) });
  }
  return out;
}
