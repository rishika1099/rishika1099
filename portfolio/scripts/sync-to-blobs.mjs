/**
 * Publish your local (gitignored) content to the deployed site by mirroring it
 * into Netlify Blobs. Nothing here ever touches GitHub.
 *
 * Mirrors:
 *   src/content/poems/*.md   ->  "poems" store        (key = slug)
 *   public/poem-art/*.png    ->  "poem-art" store     (key = slug)
 *   public/photos/<images>   ->  "photos" store       (key = filename)
 *   public/photos/captions.json -> "photos" store key "__captions__"
 *
 * Blobs not present locally are deleted, so the live site matches your folders.
 *
 * Run:  npm run sync
 * Needs NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN (npm run sync loads them from
 * .env.local). Create a token at app.netlify.com/user/applications; find the
 * site ID under Site configuration > General.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const POEMS_DIR = path.join(ROOT, "src/content/poems");
const ART_DIR = path.join(ROOT, "public/poem-art");
const PHOTOS_DIR = path.join(ROOT, "public/photos");
const CAPTIONS_FILE = path.join(PHOTOS_DIR, "captions.json");
const CAPTIONS_KEY = "__captions__";
const CLUSTERS_FILE = path.join(PHOTOS_DIR, "clusters.json");
const CLUSTERS_KEY = "__clusters__";
const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)$/i;

const siteID = process.env.NETLIFY_SITE_ID;
const token = process.env.NETLIFY_AUTH_TOKEN;
if (!siteID || !token) {
  console.error(
    "✗ Missing NETLIFY_SITE_ID and/or NETLIFY_AUTH_TOKEN.\n" +
      "  Add them to .env.local (token: app.netlify.com/user/applications).",
  );
  process.exit(1);
}

const { getStore } = await import("@netlify/blobs");
const open = (name) => getStore({ name, siteID, token });

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

/** Upload `entries` ({key,value}) to a store, then delete keys not in `keep`. */
async function mirror(name, entries, keep) {
  const s = open(name);
  for (const { key, value } of entries) {
    await s.set(key, value);
    console.log(`  ↑ ${name}/${key}`);
  }
  const { blobs } = await s.list();
  for (const { key } of blobs) {
    if (!keep.has(key)) {
      await s.delete(key);
      console.log(`  ✗ ${name}/${key} (removed)`);
    }
  }
}

// --- poems ---
const poemEntries = fs.existsSync(POEMS_DIR)
  ? fs
      .readdirSync(POEMS_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => ({
        key: f.replace(/\.md$/, ""),
        value: fs.readFileSync(path.join(POEMS_DIR, f), "utf8"),
      }))
  : [];
const MOODS_FILE = path.join(POEMS_DIR, "moods.json");
if (fs.existsSync(MOODS_FILE)) {
  poemEntries.push({ key: "__moods__", value: fs.readFileSync(MOODS_FILE, "utf8") });
}
console.log(`poems: ${poemEntries.filter((e) => !e.key.startsWith("__")).length}`);
await mirror("poems", poemEntries, new Set([...poemEntries.map((e) => e.key), "__moods__"]));

// --- poem art ---
const artEntries = fs.existsSync(ART_DIR)
  ? fs
      .readdirSync(ART_DIR)
      .filter((f) => f.endsWith(".png"))
      .map((f) => ({
        key: f.replace(/\.png$/, ""),
        value: toArrayBuffer(fs.readFileSync(path.join(ART_DIR, f))),
      }))
  : [];
console.log(`poem art: ${artEntries.length}`);
await mirror("poem-art", artEntries, new Set(artEntries.map((e) => e.key)));

// --- photos + captions ---
const photoFiles = fs.existsSync(PHOTOS_DIR)
  ? fs.readdirSync(PHOTOS_DIR).filter((f) => IMAGE_RE.test(f))
  : [];
const photoEntries = photoFiles.map((f) => ({
  key: f,
  value: toArrayBuffer(fs.readFileSync(path.join(PHOTOS_DIR, f))),
}));
if (fs.existsSync(CAPTIONS_FILE)) {
  photoEntries.push({ key: CAPTIONS_KEY, value: fs.readFileSync(CAPTIONS_FILE, "utf8") });
}
if (fs.existsSync(CLUSTERS_FILE)) {
  photoEntries.push({ key: CLUSTERS_KEY, value: fs.readFileSync(CLUSTERS_FILE, "utf8") });
}
console.log(`photos: ${photoFiles.length}`);
await mirror("photos", photoEntries, new Set([...photoFiles, CAPTIONS_KEY, CLUSTERS_KEY]));

console.log("✓ synced to Netlify Blobs");
