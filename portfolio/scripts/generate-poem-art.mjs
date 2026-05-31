#!/usr/bin/env node
// Generate symbolic black-and-white art for each poem using the OpenAI API.
//
// Two steps, mirroring the ChatGPT workflow:
//   1) an "artistic poetry interpreter" reads the poem and writes ONE image prompt
//   2) an image model renders that prompt in the soft B&W oil-pastel style
//
// Poems are confidential, so this runs locally only. The generated art is
// abstract (no poem text) and safe to ship in public/poem-art/.
//
// Usage:
//   node scripts/generate-poem-art.mjs            # only poems missing art
//   node scripts/generate-poem-art.mjs --force    # regenerate everything
//   node scripts/generate-poem-art.mjs --slug=self-love
//   node scripts/generate-poem-art.mjs --dry      # print prompts, no image (cheap)

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import OpenAI from "openai";

const ROOT = process.cwd();
const POEMS_DIR = path.join(ROOT, "src/content/poems");
const ART_DIR = path.join(ROOT, "public/poem-art");

const args = process.argv.slice(2);
const force = args.includes("--force");
const dry = args.includes("--dry");
const onlySlug = args.find((a) => a.startsWith("--slug="))?.split("=")[1];
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

loadEnvLocal();

if (!process.env.OPENAI_API_KEY) {
  console.error(
    "✗ OPENAI_API_KEY is not set. Add it to .env.local:\n    OPENAI_API_KEY=\"sk-...\"",
  );
  process.exit(1);
}

const client = new OpenAI();

const INTERPRETER = `You are an artistic poetry interpreter. You read a poem and
distill it into ONE symbolic, evocative image prompt — never literal, never
illustrating lines word-for-word. Choose a single central metaphor that captures
the poem's deepest emotion.

Reply with ONLY the image prompt, no preamble, no quotes, following EXACTLY this
structure (fill the three bracketed parts):

A soft black-and-white oil pastel and charcoal-style drawing of [scene]. The composition is minimal, with large negative space and dreamy smudged shading. The artwork represents [emotion/theme] through [visual metaphor]. Monochrome grayscale, textured paper, soft blurred edges, expressive but not overly detailed, emotional Pinterest-style poetry illustration, no text.`;

async function buildPrompt(title, body) {
  const res = await client.chat.completions.create({
    model: TEXT_MODEL,
    temperature: 0.9,
    messages: [
      { role: "system", content: INTERPRETER },
      { role: "user", content: `Title: ${title}\n\n${body}` },
    ],
  });
  return res.choices[0].message.content.trim();
}

async function renderImage(prompt, outPath) {
  const params = { model: IMAGE_MODEL, prompt, size: "1024x1024", n: 1 };
  if (IMAGE_MODEL.startsWith("dall-e")) params.response_format = "b64_json";
  const res = await client.images.generate(params);
  const b64 = res.data[0].b64_json;
  fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
}

async function main() {
  if (!fs.existsSync(POEMS_DIR)) {
    console.error(`✗ No poems directory at ${POEMS_DIR}`);
    process.exit(1);
  }
  fs.mkdirSync(ART_DIR, { recursive: true });

  const files = fs
    .readdirSync(POEMS_DIR)
    .filter((f) => f.endsWith(".md"))
    .filter((f) => !onlySlug || f === `${onlySlug}.md`);

  if (files.length === 0) {
    console.log("No matching poems found.");
    return;
  }

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const outPath = path.join(ART_DIR, `${slug}.png`);
    const exists = fs.existsSync(outPath);

    if (exists && !force && !dry) {
      console.log(`• ${slug} — art exists, skipping (use --force to redo)`);
      continue;
    }

    const { data, content } = matter(
      fs.readFileSync(path.join(POEMS_DIR, file), "utf8"),
    );
    const title = data.title || slug;

    process.stdout.write(`✎ ${slug} — interpreting… `);
    const prompt = await buildPrompt(title, content.trim());
    console.log("done");
    console.log(`  ↳ ${prompt}\n`);

    if (dry) continue;

    process.stdout.write(`  🎨 rendering → public/poem-art/${slug}.png … `);
    await renderImage(prompt, outPath);
    console.log("✓");
  }

  console.log(dry ? "\nDry run complete." : "\nAll done ✦");
}

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}

main().catch((err) => {
  console.error("\n✗ Generation failed:", err.message || err);
  process.exit(1);
});
