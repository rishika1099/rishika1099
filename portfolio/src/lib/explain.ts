import OpenAI from "openai";
import { richToText } from "@/lib/richHtml";
import { getAllProjects, reposAreComplete } from "@/lib/github-projects";
import { getAboutEntries } from "@/lib/aboutData";
import type { Entry } from "@/data/about";
import { getReadmeSnippet } from "@/lib/github-readme";
import { readStore, srcHash, writeStore, type Cached } from "@/lib/genCache";

export type Level = "default" | "eli5" | "expert";

const AUDIENCE: Record<Level, string> = {
  default:
    "the same reader the original was written for. Keep the author's voice, framing and vocabulary exactly; you are not rewriting it, you are continuing it with detail it already implies. Keep the original's grammatical shape: these open with a noun phrase naming the thing (\"An intruder-detection system fusing...\") or a past-tense verb (\"Benchmarked KIVI quantization...\"), never with \"X is a...\"",
  eli5: "a curious 10-year-old: simple everyday words, no jargon or acronyms, warm and playful",
  expert:
    "a senior ML engineer or technical recruiter: precise and concrete, name the methods, models, and any metrics, no fluff",
};

// Cards in a row are all as tall as the wordiest one, so a description shorter
// than that leaves a hole above the buttons.
//
// Writing everything up to the length of the longest does not work: the small
// experiment repos have a couple of lines of readme between them, and telling a
// model to reach 250 characters on that material is asking it to invent. They
// stayed short, the wordy ones got wordier, and the hole got bigger.
//
// So the band is set to what nearly every project can actually support, and the
// wordy ones come down to meet it. Condensing is safe in a way that padding is
// not: it is choosing among facts that are already true, where padding has to
// manufacture new ones. About four lines in a card.
// Two substantial sentences land around 210 to 280 characters. Set to 185 the
// ceiling threw away nearly every rewrite for being too long and the cards fell
// back to the one-line originals, which looked exactly like the feature not
// working. The band follows the shape now, rather than fighting it.
const BAND_LOW = 190;
const BAND_HIGH = 250;

/** One thing whose description is being written to fill its card. */
export interface Fillable {
  /** what the result is keyed by: a project name, an entry title */
  name: string;
  /** the description as it stands */
  blurb: string;
  /** everything true about it that the expansion may draw on */
  material: unknown;
}

// A prompt is a request, not a guarantee: "never open by restating the name"
// and the ban on consultant filler both slipped through often enough to reach
// the page. What matters is checked here, where it either holds or it does not.
const FILLER =
  /\b(enhanc\w*|empower\w*|leverag\w*|seamless\w*|robust solution|cutting.?edge|state.of.the.art|revolutioni\w*|showcas\w*)\b/i;

function offences(name: string, text: string): string[] {
  const bad: string[] = [];
  // "Folio: Clinical Multimodal RAG is a..." spends a fifth of the card
  // repeating the heading printed directly above it
  const head = name.split(/[:\u2013\u2014-]/)[0].trim().toLowerCase();
  if (head.length > 3 && text.trim().toLowerCase().startsWith(head)) {
    bad.push(`opens by restating the name "${name}"`);
  }
  const m = text.match(FILLER);
  if (m) bad.push(`uses the filler word "${m[0]}"`);
  return bad;
}

async function fillAll(
  level: Level,
  all: Fillable[],
  noun: string,
  /** where the results are stored, which is the level unless a caller scopes it */
  storeAs: string = level,
  deepen: (x: Fillable) => Promise<unknown> = async (x) => x.material,
  /**
   * Words per sentence. The band is expressed as a shape because a model cannot
   * count characters, and a narrower shape gives a narrower spread of card
   * heights. The About shelf is tighter than the project grid: six cards side
   * by side make an uneven one obvious in a way a twelve-wide grid does not.
   */
  words: { min: number; max: number } = { min: 16, max: 20 },
): Promise<Record<string, string>> {
  const cached = await readStore(storeAs);

  // Only what has never been written, or whose source text has changed since it
  // was. Everything else is read straight back: publishing one repo costs one
  // small batch, not ninety-eight.
  const sourceOf = (x: Fillable) => srcHash(x.blurb + JSON.stringify(x.material));
  const items = all.filter((x) => cached[x.name]?.src !== sourceOf(x));

  const done: Record<string, string> = {};
  for (const x of all) if (cached[x.name]?.src === sourceOf(x)) done[x.name] = cached[x.name].text;
  if (!items.length) return done;

  const openai = new OpenAI();
  // One request for all of them came back with 73 of 98: the model quietly drops
  // items long before it refuses, and every dropped project fell back to its
  // original one-line blurb, which is most of the empty space that was left.
  // Small batches, in parallel, keyed by position rather than by name, since a
  // name like "Just Ask Coach: NL -> SQL" does not survive the round trip
  // intact either.
  const BATCH = 12;
  const batches: Fillable[][] = [];
  for (let i = 0; i < items.length; i += BATCH) batches.push(items.slice(i, i + BATCH));

  const SHAPE =
    `Return JSON of the exact shape {"rewrites": {"0": "<new description>", "1": "..."}}, one entry for every ${noun} you were given, keyed by its "id". Do not omit any.`;

  const out: Record<string, string> = {};
  const ceiling = Math.round(BAND_HIGH * 1.25);

  const results = await Promise.all(
    batches.map(async (batch) => {
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "Rewrite each project description for the given audience.",
              // Asking for a character count does not work: told "150 to 185
              // characters" the model condensed everything to a median of 116
              // and landed 7 of 79 inside the band. It cannot count. A shape it
              // can follow gets the length as a side effect.
              "Never open by restating the project's name: the card already carries it as a heading, and \"Folio: Clinical Multimodal RAG is a...\" spends a fifth of the space saying nothing. Open with the noun phrase itself (\"A multimodal medical-record companion that...\") or with what it did (\"Benchmarked KIVI quantization...\").",
              `Write exactly two full sentences for each. The first says what the thing is and what it is built with. The second says what it does, measures, or found. Each sentence must be ${words.min} to ${words.max} words: not fewer, not more. They sit in a row of equal-height cards, so an uneven one leaves its card visibly empty.`,
              "Expand a short one with real detail from its readme, tags and areas. Condense a long one by keeping what is most concrete, the numbers and the named methods first, and dropping the rest: never truncate it mid-thought, and never lose the thing the project actually is.",
              "Reach that length with real detail drawn from the project's own readme, tags, areas and domains. Never pad with filler, restatement, or adjectives, and never invent a fact that is not in the material you were given. If a project genuinely has too little material, write one honest sentence rather than making a second one up.",
              "Keep every fact truthful. Do not use em dashes or en dashes. Never reach the length with consultant filler: no \"enhancing\", \"empowering\", \"leveraging\", \"seamless\", \"robust solution\", or a closing clause about the value it delivers.",
              "These describe one person's own projects on her portfolio. Write in the third person about the work itself: never \"the team\", \"we\", or \"I\", and never address the reader as \"you\" or \"your\".",
              SHAPE,
            ].join(" "),
          },
          {
            role: "user",
            content: `Audience: ${AUDIENCE[level]}\n\nProjects:\n${JSON.stringify(
              batch.map((x, i) => ({ id: i, ...x })),
            )}`,
          },
        ],
      });
      const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
      const got: Record<string, string> = {};
      if (parsed.rewrites && typeof parsed.rewrites === "object") {
        for (const [k, v] of Object.entries(parsed.rewrites)) {
          const item = batch[Number(k)];
          // A rewrite that ignored the ceiling would set the height for every
          // card in the row, which is the problem this exists to solve.
          if (item && typeof v === "string" && v.length <= ceiling) got[item.name] = v;
        }
      }
      return got;
    }),
  ).catch(() => [] as Record<string, string>[]);

  for (const got of results) Object.assign(out, got);

  // Second pass: the gap, measured. A project whose readme is thin is told to
  // stay short rather than invent, so it comes back under and its card still
  // ends in space. Those are the only ones asked again, with a much larger
  // slice of the readme to draw on.
  const short = items.filter((x) => {
    const got = out[x.name];
    // missing counts as short: a batch that quietly dropped an item leaves the
    // card on its original one-liner, which looks the same as a failed fill
    return !got || got.length < BAND_LOW * 0.9;
  });
  if (short.length) {
    try {
      const deeper = await Promise.all(short.map((x) => deepen(x)));
      const again = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "Each of these descriptions came back shorter than its card needs, leaving the card visibly empty under the text.",
              "Rewrite each as exactly two full sentences of 12 to 22 words each, using the fuller readme now provided: what it is and what it is built with, then what it does, measures, or found.",
              "Do not pad, restate, or add adjectives, and do not invent anything absent from the readme. If the readme still does not support a second sentence, return the description unchanged rather than making one up.",
              "Keep the existing wording and voice. Third person, no \"the team\", \"we\", or \"you\". No em dashes or en dashes.",
              SHAPE,
            ].join(" "),
          },
          {
            role: "user",
            content: `Audience: ${AUDIENCE[level]}\n\nProjects:\n${JSON.stringify(
              short.map((x, i) => ({
                id: i,
                name: x.name,
                current: out[x.name] ?? x.blurb,

                material: deeper[i] || x.material,
              })),
            )}`,
          },
        ],
      });
      const parsed2 = JSON.parse(again.choices[0]?.message?.content ?? "{}");
      if (parsed2.rewrites && typeof parsed2.rewrites === "object") {
        for (const [k, v] of Object.entries(parsed2.rewrites)) {
          const item = short[Number(k)];
          // only ever accept a longer one: the top-up must not shrink a card
          if (item && typeof v === "string" && v.length > out[item.name].length && v.length <= ceiling) {
            out[item.name] = v;
          }
        }
      }
    } catch {
      // the first pass already produced usable text; a failed top-up just
      // leaves the shortest cards as they were
    }
  }

  // Third pass: whatever broke a rule that can be checked, re-asked with the
  // rule it broke quoted back at it. Only the offenders, and only once.
  const bad = items
    .map((x) => ({ x, why: out[x.name] ? offences(x.name, out[x.name]) : [] }))
    .filter((r) => r.why.length);
  if (bad.length) {
    try {
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "Each of these descriptions broke a rule, named against it. Rewrite only to fix that, keeping the facts, the voice, and roughly the length.",
              "The name of the thing is already printed directly above the description, so it must never begin by repeating it: open with the noun phrase itself or with what it did.",
              "Never use consultant filler: no enhancing, empowering, leveraging, seamless, robust solution, cutting-edge, state of the art, showcasing, and no closing clause about the value delivered.",
              SHAPE,
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify(
              bad.map((r, i) => ({ id: i, name: r.x.name, current: out[r.x.name], broke: r.why })),
            ),
          },
        ],
      });
      const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
      if (parsed.rewrites && typeof parsed.rewrites === "object") {
        for (const [k, v] of Object.entries(parsed.rewrites)) {
          const r = bad[Number(k)];
          // only take the retry if it actually fixed what it was asked to fix
          if (r && typeof v === "string" && v.length <= ceiling && !offences(r.x.name, v).length) {
            out[r.x.name] = v;
          }
        }
      }
    } catch {
      // the text is still true and the right length, just less tidy
    }
  }

  // Written once, read back forever after: only an item whose source text
  // changed is ever computed again.
  const merged: Record<string, Cached> = { ...cached };
  for (const x of items) {
    if (out[x.name]) merged[x.name] = { src: sourceOf(x), text: out[x.name] };
  }
  await writeStore(storeAs, merged);

  return { ...done, ...out };
}

export async function explainProjects(level: Level): Promise<Record<string, string>> {
  const projects = await getAllProjects();

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
  const list: Fillable[] = projects.map((p, i) => ({
    name: p.name,
    blurb: richToText(p.blurb),
    material: {
      tags: p.tags,
      areas: p.categories,
      domains: p.domains ?? [],
      readme: readmes[i] || "",
    },
  }));

  const out = await fillAll(level, list, "project", level, async (x) => {
    // the top-up gets far more of the readme than the first pass did: it is
    // asked only about the handful that came back short
    const repo = projects.find((p) => p.name === x.name)?.repo;
    const readme = repo ? await getReadmeSnippet(repo, 3000) : "";
    return readme ? { ...(x.material as object), readme } : x.material;
  });

  return out;
}

/**
 * The same fill for the About cards. A job, a degree or a certificate carries a
 * one-line note and, behind the click, the details: the material is already
 * written and already true, so the note can be brought up to the card's height
 * out of the entry's own words rather than out of a readme.
 */
export async function explainAbout(level: Level): Promise<Record<string, string>> {
  const { education, timeline, certifications } = await getAboutEntries();
  const entries: Entry[] = [...education, ...timeline, ...certifications];

  const key = `about-${level}`;

  const list: Fillable[] = entries.map((e) => ({
    name: richToText(e.title),
    blurb: richToText(e.note),
    material: {
      when: richToText(e.when),
      place: richToText(e.place),
      subtitle: e.subtitle ? richToText(e.subtitle) : "",
      domains: e.domains ?? [],
      tech: e.tech ?? [],
      // the bullets or rich block the card opens into: the real substance
      details: Array.isArray(e.details)
        ? e.details.map((d) => richToText(d, 1200))
        : e.details
          ? richToText(e.details, 4000)
          : "",
    },
  }));

  const out = await fillAll(level, list, "entry", key, undefined, { min: 15, max: 17 });
  return out;
}
