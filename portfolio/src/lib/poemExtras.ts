// What a poem gets besides its words: a mood tag and a picture.
//
// Both used to be made only by `npm run media` on her machine, so a poem added
// from the atelier arrived with neither: a candle where its art should be and
// no mood chip. Now saving a poem fills in whichever it is missing, in the
// background after the save has answered. Neither is ever redone once it
// exists; the art manager in the atelier is where art is changed.

import OpenAI from "openai";
import { MOODS } from "@/lib/moods";
import { getPoem, readMoods, setMood } from "@/lib/poems-store";
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

/** Give a poem whatever it is missing. Each part is tried on its own. */
export async function fillPoem(
  slug: string,
): Promise<{ mood: boolean; art: boolean; errors: string[] }> {
  const done = { mood: false, art: false, errors: [] as string[] };
  const why = (part: string, e: unknown) => {
    const msg = `${part}: ${e instanceof Error ? e.message : String(e)}`;
    done.errors.push(msg);
    // the background run has no one to answer to, so the function log is where this goes
    console.error(`[poem ${slug}] ${msg}`);
  };
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
