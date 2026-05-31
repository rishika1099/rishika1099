import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import OpenAI from "openai";

const POEMS_DIR = path.join(process.cwd(), "src/content/poems");
const ART_DIR = path.join(process.cwd(), "public/poem-art");

const INTERPRETER = `You are an artistic poetry interpreter. You read a poem and
distill it into ONE symbolic, evocative image prompt — never literal, never
illustrating lines word-for-word. Choose a single central metaphor that captures
the poem's deepest emotion.

Reply with ONLY the image prompt, no preamble, no quotes, following EXACTLY this
structure (fill the three bracketed parts):

A soft black-and-white oil pastel and charcoal-style drawing of [scene]. The composition is minimal, with large negative space and dreamy smudged shading. The artwork represents [emotion/theme] through [visual metaphor]. Monochrome grayscale, textured paper, soft blurred edges, expressive but not overly detailed, emotional Pinterest-style poetry illustration, no text.`;

let client: OpenAI | null = null;
function openai(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  client ??= new OpenAI();
  return client;
}

function safeSlug(slug: string): string {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("Invalid slug");
  return slug;
}

async function buildPrompt(title: string, body: string): Promise<string> {
  const res = await openai().chat.completions.create({
    model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
    temperature: 0.9,
    messages: [
      { role: "system", content: INTERPRETER },
      { role: "user", content: `Title: ${title}\n\n${body}` },
    ],
  });
  return res.choices[0].message.content?.trim() ?? "";
}

async function renderImage(prompt: string): Promise<Buffer> {
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
  const params: Record<string, unknown> = {
    model,
    prompt,
    size: "1024x1024",
    n: 1,
  };
  if (model.startsWith("dall-e")) params.response_format = "b64_json";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await openai().images.generate(params as any);
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image model returned no data");
  return Buffer.from(b64, "base64");
}

/**
 * Return the PNG bytes for a poem's art, generating + caching it on first use.
 * Generation reads the (local, gitignored) poem and never exposes its text.
 */
export async function ensurePoemArt(slugRaw: string): Promise<Buffer> {
  const slug = safeSlug(slugRaw);
  const outPath = path.join(ART_DIR, `${slug}.png`);

  if (fs.existsSync(outPath)) return fs.readFileSync(outPath);

  const mdPath = path.join(POEMS_DIR, `${slug}.md`);
  if (!fs.existsSync(mdPath)) throw new Error("Poem not found");

  const { data, content } = matter(fs.readFileSync(mdPath, "utf8"));
  const prompt = await buildPrompt(
    (data.title as string) || slug,
    content.trim(),
  );
  const png = await renderImage(prompt);

  fs.mkdirSync(ART_DIR, { recursive: true });
  fs.writeFileSync(outPath, png);
  return png;
}
