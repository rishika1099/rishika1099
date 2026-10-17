import fs from "node:fs";
import path from "node:path";
import { blobsEnabled } from "@/lib/blobs";
import { generateArt } from "@/lib/poemArt";

// Poem art, with variants beyond the single active image:
//   active         -> what the poem room shows            (key: <slug>)
//   draft          -> a freshly made/uploaded candidate    (key: <slug>~draft)
//   saved:<id>     -> kept versions you can come back to    (key: <slug>~saved~<id>)
// An index lists the saved versions per slug. Everything lives in the private
// "poem-art" Blobs store on deploy, or the gitignored public/poem-art folder in
// dev, exactly like the original single-image cache.

const ART_DIR = path.join(process.cwd(), "public/poem-art");

// Every read here is the latest copy, not the nearest one. These are the
// editor's reads: right after "regenerate" it asks for the new draft, and an
// eventually consistent read could still hand back the draft before it, which
// looked exactly like the model drawing the same picture twice. The poem room
// itself reads through poemArt.ts and keeps its fast, cached reads.
async function artStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore({ name: "poem-art", consistency: "strong" });
}
const INDEX_KEY = "~index";
// her direction for each poem's picture ("no trees"), by slug
const NOTES_KEY = "~notes";
const NOTES_FILE = path.join(process.cwd(), "public/poem-art/_art-notes.json");
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
    const s = await artStore();
    const buf = await s.get(keyFor(slug, v), { type: "arrayBuffer" });
    return buf ? Buffer.from(buf) : null;
  }
  const f = fileFor(slug, v);
  return fs.existsSync(f) ? fs.readFileSync(f) : null;
}

async function writeArt(slug: string, v: Variant, png: Buffer): Promise<void> {
  if (blobsEnabled()) {
    const s = await artStore();
    const ab = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer;
    await s.set(keyFor(slug, v), ab);
  } else {
    fs.mkdirSync(ART_DIR, { recursive: true });
    fs.writeFileSync(fileFor(slug, v), png);
  }
}

async function deleteArt(slug: string, v: Variant): Promise<void> {
  if (blobsEnabled()) {
    const s = await artStore();
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
      const s = await artStore();
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
    const s = await artStore();
    await s.setJSON(INDEX_KEY, idx);
  } else {
    fs.mkdirSync(ART_DIR, { recursive: true });
    fs.writeFileSync(INDEX_FILE, JSON.stringify(idx, null, 2));
  }
}

async function readNotes(): Promise<Record<string, string>> {
  try {
    if (blobsEnabled()) {
      const raw = await (await artStore()).get(NOTES_KEY, { type: "text" });
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    }
    return fs.existsSync(NOTES_FILE) ? (JSON.parse(fs.readFileSync(NOTES_FILE, "utf8")) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/** What she has asked of this poem's picture, if anything. */
export async function getArtNote(slug: string): Promise<string> {
  return (await readNotes())[safeSlug(slug)] ?? "";
}

/** Keep (or, empty, forget) her direction for this poem's picture. */
export async function setArtNote(slug: string, note: string): Promise<void> {
  const notes = await readNotes();
  const clean = note.replace(/\s+/g, " ").trim().slice(0, 300);
  if (clean) notes[safeSlug(slug)] = clean;
  else delete notes[safeSlug(slug)];
  if (blobsEnabled()) {
    await (await artStore()).setJSON(NOTES_KEY, notes);
  } else {
    fs.mkdirSync(ART_DIR, { recursive: true });
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
  }
}

export async function listSaved(slug: string): Promise<SavedArt[]> {
  const idx = await readIndex();
  return (idx[safeSlug(slug)] ?? []).slice().sort((a, b) => b.ts - a.ts);
}

/** Regenerate: render fresh art and stash it as the draft (not live yet). */
export async function regenerateDraft(slug: string): Promise<void> {
  const png = await generateArt(safeSlug(slug), await getArtNote(slug));
  await writeArt(slug, "draft", png);
}

/** Whether a poem has live art yet. */
export async function hasActiveArt(slug: string): Promise<boolean> {
  return !!(await readArt(safeSlug(slug), "active"));
}

/** Make art for a poem that has none, and put it straight live. */
export async function generateFirstArt(slug: string): Promise<void> {
  const png = await generateArt(safeSlug(slug), await getArtNote(slug));
  await writeArt(slug, "active", png);
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
  const [active, draft, saved, note] = await Promise.all([
    readArt(slug, "active"),
    readArt(slug, "draft"),
    listSaved(slug),
    getArtNote(slug),
  ]);
  return { hasActive: !!active, hasDraft: !!draft, saved, note };
}
