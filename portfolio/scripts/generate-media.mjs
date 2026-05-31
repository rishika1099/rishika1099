/**
 * Generate the media that the site shows but never commits:
 *   - symbolic B&W art for each poem  (public/poem-art/<slug>.png)
 *   - a short caption for each photo   (public/photos/captions.json)
 *
 * Only NEW items are generated; anything already cached is left untouched.
 *
 * Run it after adding a poem or a photo:
 *   npm run media
 *
 * Needs OPENAI_API_KEY (npm run media loads it from .env.local for you).
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import OpenAI from "openai";

const ROOT = process.cwd();
const POEMS_DIR = path.join(ROOT, "src/content/poems");
const ART_DIR = path.join(ROOT, "public/poem-art");
const PHOTOS_DIR = path.join(ROOT, "public/photos");
const CAPTIONS_FILE = path.join(PHOTOS_DIR, "captions.json");

const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)$/i;
const MIME = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

if (!process.env.OPENAI_API_KEY) {
  console.error("✗ OPENAI_API_KEY is not set. Add it to .env.local.");
  process.exit(1);
}
const openai = new OpenAI();

const INTERPRETER = `You are an artistic poetry interpreter. You read a poem and
distill it into ONE symbolic, evocative image prompt, never literal, never
illustrating lines word-for-word. Choose a single central metaphor that captures
the poem's deepest emotion.

Reply with ONLY the image prompt, no preamble, no quotes, following EXACTLY this
structure (fill the three bracketed parts):

A soft black-and-white oil pastel and charcoal-style drawing of [scene]. The composition is minimal, with large negative space and dreamy smudged shading. The artwork represents [emotion/theme] through [visual metaphor]. Monochrome grayscale, textured paper, soft blurred edges, expressive but not overly detailed, emotional Pinterest-style poetry illustration, no text.`;

// Retry a call on 429 rate limits (OpenAI caps image gen at a few per minute).
async function withRetry(fn, label) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const retryAfter = Number(err?.headers?.["retry-after"]);
      if (err?.status === 429 && attempt <= 5) {
        const wait = Number.isFinite(retryAfter) ? retryAfter * 1000 : 20000;
        console.log(`  rate limited on ${label}, waiting ${Math.round(wait / 1000)}s …`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
}

async function generatePoemArt() {
  if (!fs.existsSync(POEMS_DIR)) return;
  fs.mkdirSync(ART_DIR, { recursive: true });

  const poems = fs.readdirSync(POEMS_DIR).filter((f) => f.endsWith(".md"));
  for (const file of poems) {
    const slug = file.replace(/\.md$/, "");
    const out = path.join(ART_DIR, `${slug}.png`);
    if (fs.existsSync(out)) continue; // already made, never regenerate

    const { data, content } = matter(fs.readFileSync(path.join(POEMS_DIR, file), "utf8"));
    process.stdout.write(`🎨 poem art: ${slug} … `);

    const prompt = await openai.chat.completions
      .create({
        model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
        temperature: 0.9,
        messages: [
          { role: "system", content: INTERPRETER },
          { role: "user", content: `Title: ${data.title || slug}\n\n${content.trim()}` },
        ],
      })
      .then((r) => r.choices[0].message.content?.trim() ?? "");

    const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
    const params = { model, prompt, size: "1024x1024", n: 1 };
    if (model.startsWith("dall-e")) params.response_format = "b64_json";
    const img = await withRetry(() => openai.images.generate(params), `image ${slug}`);
    const b64 = img.data?.[0]?.b64_json;
    if (!b64) throw new Error("image model returned no data");
    fs.writeFileSync(out, Buffer.from(b64, "base64"));
    console.log("done");
  }
}

async function generateCaptions() {
  if (!fs.existsSync(PHOTOS_DIR)) return;
  const files = fs.readdirSync(PHOTOS_DIR).filter((f) => IMAGE_RE.test(f));
  if (files.length === 0) return;

  let captions = {};
  if (fs.existsSync(CAPTIONS_FILE)) {
    try {
      captions = JSON.parse(fs.readFileSync(CAPTIONS_FILE, "utf8"));
    } catch {
      captions = {};
    }
  }

  let changed = false;
  for (const file of files) {
    if (captions[file]) continue; // already captioned, never regenerate

    const ext = file.split(".").pop().toLowerCase();
    const b64 = fs.readFileSync(path.join(PHOTOS_DIR, file)).toString("base64");
    process.stdout.write(`📷 caption: ${file} … `);

    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "Write a short, poetic, lowercase caption (4 to 8 words) for this photo. " +
            "Evocative and gentle, like a line in a journal. No quotes, no period.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Caption this photo." },
            {
              type: "image_url",
              image_url: { url: `data:${MIME[ext] || "image/jpeg"};base64,${b64}` },
            },
          ],
        },
      ],
    });

    captions[file] = res.choices[0].message.content?.trim().replace(/^["']|["']$/g, "") ?? "";
    changed = true;
    console.log(`"${captions[file]}"`);
  }

  if (changed) {
    fs.writeFileSync(CAPTIONS_FILE, JSON.stringify(captions, null, 2) + "\n");
    console.log(`✦ wrote ${CAPTIONS_FILE}`);
  }
}

await generatePoemArt();
await generateCaptions();
console.log("✓ media up to date");
