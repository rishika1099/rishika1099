import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";
import { generateArt } from "@/lib/poemArt";

// Poem art, with variants beyond the single active image:
//   active         -> what the poem room shows            (key: <slug>)
//   draft          -> a freshly made/uploaded candidate    (key: <slug>~draft)
//   saved:<id>     -> kept versions you can come back to    (key: <slug>~saved~<id>)
// An index lists the saved versions per slug. Everything lives in the private
// "poem-art" Blobs store on deploy, or the gitignored public/poem-art folder in
// dev, exactly like the original single-image cache.

const ART_DIR = path.join(process.cwd(), "public/poem-art");
const INDEX_KEY = "~index";
const INDEX_FILE = path.join(ART_DIR, "_art-index.json");

export type SavedArt = { id: string; ts: number };
type ArtIndex = Record<string, SavedArt[]>;

function safeSlug(slug: string): string {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("Invalid slug");
  return slug;
}

export type Variant = "active" | "draft" | { saved: string };

function keyFor(slug: string, v: Variant): string {
  if (v === "active") return slug;
  if (v === "draft") return `${slug}~draft`;
  return `${slug}~saved~${v.saved}`;
}
function fileFor(slug: string, v: Variant): string {
  return path.join(ART_DIR, `${keyFor(slug, v)}.png`);
}

export async function readArt(slug: string, v: Variant): Promise<Buffer | null> {
  safeSlug(slug);
  if (blobsEnabled()) {
    const s = await store("poem-art");
    const buf = await s.get(keyFor(slug, v), { type: "arrayBuffer" });
    return buf ? Buffer.from(buf) : null;
  }
  const f = fileFor(slug, v);
  return fs.existsSync(f) ? fs.readFileSync(f) : null;
}

async function writeArt(slug: string, v: Variant, png: Buffer): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("poem-art");
    const ab = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
    await s.set(keyFor(slug, v), ab);
  } else {
    fs.mkdirSync(ART_DIR, { recursive: true });
    fs.writeFileSync(fileFor(slug, v), png);
  }
}

async function deleteArt(slug: string, v: Variant): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("poem-art");
    await s.delete(keyFor(slug, v));
  } else {
    const f = fileFor(slug, v);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}

async function readIndex(): Promise<ArtIndex> {
  try {
    let raw: string | null = null;
    if (blobsEnabled()) {
      const s = await store("poem-art");
      raw = (await s.get(INDEX_KEY, { type: "text" })) ?? null;
    } else if (fs.existsSync(INDEX_FILE)) {
      raw = fs.readFileSync(INDEX_FILE, "utf8");
    }
    return raw ? (JSON.parse(raw) as ArtIndex) : {};
  } catch {
    return {};
  }
}

async function writeIndex(idx: ArtIndex): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("poem-art");
    await s.setJSON(INDEX_KEY, idx);
  } else {
    fs.mkdirSync(ART_DIR, { recursive: true });
    fs.writeFileSync(INDEX_FILE, JSON.stringify(idx, null, 2));
  }
}

export async function listSaved(slug: string): Promise<SavedArt[]> {
  const idx = await readIndex();
  return (idx[safeSlug(slug)] ?? []).slice().sort((a, b) => b.ts - a.ts);
}

/** Regenerate: render fresh art and stash it as the draft (not live yet). */
export async function regenerateDraft(slug: string): Promise<void> {
  const png = await generateArt(safeSlug(slug));
  await writeArt(slug, "draft", png);
}

/** Upload: stash an uploaded PNG as the draft (previewed before going live). */
export async function uploadDraft(slug: string, png: Buffer): Promise<void> {
  await writeArt(safeSlug(slug), "draft", png);
}

/** Accept the draft: it becomes the live art; the draft is cleared. */
export async function acceptDraft(slug: string): Promise<boolean> {
  const draft = await readArt(slug, "draft");
  if (!draft) return false;
  await writeArt(slug, "active", draft);
  await deleteArt(slug, "draft");
  return true;
}

export async function discardDraft(slug: string): Promise<void> {
  await deleteArt(safeSlug(slug), "draft");
}

/** Keep the current live art as a saved version to come back to later. */
export async function saveCurrent(slug: string): Promise<SavedArt | null> {
  const active = await readArt(slug, "active");
  if (!active) return null;
  const entry: SavedArt = { id: Date.now().toString(36), ts: Date.now() };
  await writeArt(slug, { saved: entry.id }, active);
  const idx = await readIndex();
  idx[slug] = [entry, ...(idx[slug] ?? [])];
  await writeIndex(idx);
  return entry;
}

/** Bring a saved version back as the live art. */
export async function restoreSaved(slug: string, id: string): Promise<boolean> {
  const saved = await readArt(slug, { saved: id });
  if (!saved) return false;
  await writeArt(slug, "active", saved);
  return true;
}

export async function removeSaved(slug: string, id: string): Promise<void> {
  await deleteArt(slug, { saved: id });
  const idx = await readIndex();
  idx[slug] = (idx[slug] ?? []).filter((e) => e.id !== id);
  await writeIndex(idx);
}

export async function artStatus(slug: string) {
  const [active, draft, saved] = await Promise.all([
    readArt(slug, "active"),
    readArt(slug, "draft"),
    listSaved(slug),
  ]);
  return { hasActive: !!active, hasDraft: !!draft, saved };
}
