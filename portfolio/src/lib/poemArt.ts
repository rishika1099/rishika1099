import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { getPoem } from "@/lib/poems-store";
import { blobsEnabled, store } from "@/lib/blobs";

// Generated art is cached as a PNG in this gitignored folder locally, and in the
// private "poem-art" Blobs store on the deployed site (populated by `npm run sync`).
const ART_DIR = path.join(process.cwd(), "public/poem-art");

async function readCachedArt(slug: string): Promise<Buffer | null> {
  if (blobsEnabled()) {
    const s = await store("poem-art");
    const buf = await s.get(slug, { type: "arrayBuffer" });
    return buf ? Buffer.from(buf) : null;
  }
  const outPath = path.join(ART_DIR, `${slug}.png`);
  return fs.existsSync(outPath) ? fs.readFileSync(outPath) : null;
}

function writeCachedArt(slug: string, png: Buffer): void {
  fs.mkdirSync(ART_DIR, { recursive: true });
  fs.writeFileSync(path.join(ART_DIR, `${slug}.png`), png);
}

const INTERPRETER = `You are an artistic poetry interpreter. You read a poem and
distill it into ONE symbolic, evocative image prompt, never literal, never
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

export async function buildPrompt(title: string, body: string): Promise<string> {
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

async function tryRender(model: string, prompt: string): Promise<Buffer> {
  const params: Record<string, unknown> = { model, prompt, size: "1024x1024", n: 1 };
  if (model.startsWith("dall-e")) params.response_format = "b64_json";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await openai().images.generate(params as any);
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image model returned no data");
  return Buffer.from(b64, "base64");
}

export async function renderImage(prompt: string): Promise<Buffer> {
  // gpt-image-1 needs OpenAI org verification; if it isn't available, fall back
  // to the widely-available DALL·E models so art still generates.
  const primary = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
  const chain = [primary, "dall-e-3", "dall-e-2"].filter((m, i, a) => a.indexOf(m) === i);
  let lastErr: unknown;
  for (const model of chain) {
    try {
      return await tryRender(model, prompt);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("image generation failed");
}

/** Freshly render a poem's art (no cache read/write); used by the art manager. */
export async function generateArt(slugRaw: string): Promise<Buffer> {
  const slug = safeSlug(slugRaw);
  const poem = await getPoem(slug);
  if (!poem) throw new Error("Poem not found");
  const prompt = await buildPrompt(poem.title || slug, poem.content.trim());
  return renderImage(prompt);
}

/**
 * Return the PNG bytes for a poem's art, generating + caching it on first use.
 * Generation reads the (local, gitignored) poem and never exposes its text.
 */
export async function ensurePoemArt(slugRaw: string): Promise<Buffer> {
  const slug = safeSlug(slugRaw);

  const cached = await readCachedArt(slug);
  if (cached) return cached;

  // On the deployed site we never generate (no key, read-only fs); art is made
  // locally via `npm run media` and pushed up with `npm run sync`.
  if (blobsEnabled()) throw new Error("Poem art not found");

  const poem = await getPoem(slug);
  if (!poem) throw new Error("Poem not found");

  const prompt = await buildPrompt(poem.title || slug, poem.content.trim());
  const png = await renderImage(prompt);

  writeCachedArt(slug, png);
  return png;
}
