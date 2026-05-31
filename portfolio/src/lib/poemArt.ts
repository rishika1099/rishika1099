import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { getPoem } from "@/lib/poems-store";

const ART_DIR = path.join(process.cwd(), "public/poem-art");

function blobsEnabled(): boolean {
  return !!(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
}

async function artStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore("poem-art");
}

async function readCachedArt(slug: string): Promise<Buffer | null> {
  if (blobsEnabled()) {
    const store = await artStore();
    const buf = await store.get(slug, { type: "arrayBuffer" });
    return buf ? Buffer.from(buf) : null;
  }
  const outPath = path.join(ART_DIR, `${slug}.png`);
  return fs.existsSync(outPath) ? fs.readFileSync(outPath) : null;
}

async function writeCachedArt(slug: string, png: Buffer): Promise<void> {
  if (blobsEnabled()) {
    const store = await artStore();
    const ab = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength);
    await store.set(slug, ab as ArrayBuffer);
    return;
  }
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

  const cached = await readCachedArt(slug);
  if (cached) return cached;

  const poem = await getPoem(slug);
  if (!poem) throw new Error("Poem not found");

  const prompt = await buildPrompt(poem.title || slug, poem.content.trim());
  const png = await renderImage(prompt);

  await writeCachedArt(slug, png);
  return png;
}
