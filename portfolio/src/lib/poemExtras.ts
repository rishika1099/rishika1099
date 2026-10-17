// What a poem gets besides its words: a one-line teaser, a mood tag and a picture.
//
// Both used to be made only by `npm run media` on her machine, so a poem added
// from the atelier arrived with neither: a candle where its art should be and
// no mood chip. Now saving a poem fills in whichever it is missing, in the
// background after the save has answered. Neither is ever redone once it
// exists; the art manager in the atelier is where art is changed.

import OpenAI from "openai";
import { MOODS } from "@/lib/moods";
import { getPoem, readMoods, savePoem, setMood } from "@/lib/poems-store";
import { generateFirstArt, hasActiveArt } from "@/lib/poemArtStore";
import { richToText } from "@/lib/richHtml";

/** The same classification `npm run media` does, so the two agree. */
export async function tagMood(slug: string): Promise<void> {
  const poem = await getPoem(slug);
  if (!poem || !process.env.OPENAI_API_KEY) return;
  const body = poem.rich ? richToText(poem.content) : poem.content;
  const res = await new OpenAI().chat.completions.create({
    model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          `Classify the poem's single dominant mood as exactly one of: ${MOODS.join(", ")}. ` +
          `Reply as JSON: {"mood": <one of the list>, "confidence": <0..1 how sure you are>}.`,
      },
      { role: "user", content: `Title: ${poem.title || slug}\n\n${body.trim()}` },
    ],
  });
  let parsed: { mood?: string; confidence?: number } = {};
  try {
    parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
  } catch {
    parsed = {};
  }
  const mood = (MOODS as readonly string[]).includes(parsed.mood ?? "") ? (parsed.mood as string) : MOODS[0];
  const confidence = typeof parsed.confidence === "number" ? Number(parsed.confidence.toFixed(2)) : null;
  await setMood(slug, mood, confidence);
}

// A caption, not a quotation. The card already leads to the poem; what it
// needs under the title is what the poem is about, in a breath. Written in the
// voice of the captions she wrote herself for her recent poems.
const ONE_LINER = [
  "You write the caption shown under a poem's title on its card in a poetry gallery.",
  "Capture the essence of the whole poem: what it is about and what it feels like, in one lowercase line of 8 to 16 words.",
  "Never quote the poem, never reuse one of its lines or a phrase of more than three of its words, and never summarize just its opening.",
  "It should read like these:",
  "\"a thought that sank too deep, and the fear of being consumed again.\"",
  "\"the ghost of who I used to be, and a quiet wish to become me again.\"",
  "\"two strangers, aligned stars, and falling before you were ever mine.\"",
  "Keep the pronoun I where the poem is in the first person. Do not repeat the title. No quotes, no em dashes or en dashes, end with a period.",
].join(" ");

const words = (t: string) => t.toLowerCase().match(/[a-z']+/g) ?? [];

/** Whether `line` lifts a run of four or more words straight out of `body`. */
export function quotes(line: string, body: string): boolean {
  const l = words(line);
  const text = ` ${words(body).join(" ")} `;
  for (let i = 0; i + 4 <= l.length; i++) {
    if (text.includes(` ${l.slice(i, i + 4).join(" ")} `)) return true;
  }
  return false;
}

/**
 * A caption for the poem's card. Only when it has none, unless `replace` is
 * set: that is for redoing ones that quote the poem instead of capturing it.
 */
export async function writeOneLiner(slug: string, replace = false): Promise<string | null> {
  const poem = await getPoem(slug, true);
  if (!poem || (poem.excerpt.trim() && !replace) || !process.env.OPENAI_API_KEY) return null;
  const body = (poem.rich ? richToText(poem.content) : poem.content).trim();
  const ask = async (extra: string) => {
    const res = await new OpenAI().chat.completions.create({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
      temperature: 0.6,
      max_tokens: 60,
      messages: [
        { role: "system", content: ONE_LINER },
        { role: "user", content: `Title: ${poem.title}\n\n${body}${extra}` },
      ],
    });
    let line = (res.choices[0]?.message?.content ?? "").trim().replace(/^["'\u201c]+|["'\u201d]+$/g, "");
    // her rule, kept in code: the model is asked, and sometimes forgets
    line = line.replace(/\s*[\u2014\u2013]\s*/g, ", ").replace(/\s+/g, " ").slice(0, 160);
    if (line && !/[.!?]$/.test(line)) line += ".";
    return line;
  };
  // checked, not trusted: a line that lifts the poem's words is asked for again
  let line = await ask("");
  for (let n = 0; n < 2 && line && quotes(line, body); n++) {
    line = await ask(`\n\n(Your caption "${line}" reuses the poem's own words. Say what it is about in different words.)`);
  }
  if (!line || quotes(line, body)) return null;
  // read again just before writing, so an edit made meanwhile is not undone
  const latest = await getPoem(slug, true);
  if (!latest || (latest.excerpt.trim() && !replace)) return null;
  await savePoem({ ...latest, excerpt: line });
  return line;
}

/** Give a poem whatever it is missing. Each part is tried on its own. */
export async function fillPoem(
  slug: string,
): Promise<{ line: boolean; mood: boolean; art: boolean; errors: string[] }> {
  const done = { line: false, mood: false, art: false, errors: [] as string[] };
  const why = (part: string, e: unknown) => {
    const msg = `${part}: ${e instanceof Error ? e.message : String(e)}`;
    done.errors.push(msg);
    // the background run has no one to answer to, so the function log is where this goes
    console.error(`[poem ${slug}] ${msg}`);
  };
  try {
    const poem = await getPoem(slug, true);
    if (poem && !poem.excerpt.trim()) {
      done.line = !!(await writeOneLiner(slug));
    }
  } catch (e) {
    why("one-liner", e);
  }
  try {
    if (!(await readMoods())[slug]) {
      await tagMood(slug);
      done.mood = true;
    }
  } catch (e) {
    why("mood", e); // the art below is still worth trying
  }
  try {
    if (!(await hasActiveArt(slug))) {
      await generateFirstArt(slug);
      done.art = true;
    }
  } catch (e) {
    why("art", e); // left for the art manager's "regenerate"
  }
  return done;
}
