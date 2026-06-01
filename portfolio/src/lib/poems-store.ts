import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { blobsEnabled, store } from "@/lib/blobs";

export interface Poem {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  image?: string;
  mood?: string;
  moodConfidence?: number | null;
}

const MOODS_KEY = "__moods__";
type MoodMap = Record<string, { mood: string; confidence: number | null }>;

/**
 * Poems live as `.md` files in this local folder (gitignored, off the public
 * repo). On the deployed site they're read from the private "poems" Blobs store,
 * which `npm run sync` populates from this same folder.
 */
const POEMS_DIR = path.join(process.cwd(), "src/content/poems");

function imageFor(slug: string): string {
  return `/poem-art/${slug}.png`;
}

function fromRaw(slug: string, raw: string): Poem {
  const { data, content } = matter(raw);
  return {
    slug,
    title: (data.title as string) ?? slug,
    date: (data.date as string) ?? "",
    excerpt: (data.excerpt as string) ?? "",
    content: content.trim(),
    image: (data.image as string) ?? imageFor(slug),
  };
}

async function readMoods(): Promise<MoodMap> {
  let raw: string | null = null;
  if (blobsEnabled()) {
    const s = await store("poems");
    raw = (await s.get(MOODS_KEY, { type: "text" })) ?? null;
  } else {
    const f = path.join(POEMS_DIR, "moods.json");
    if (fs.existsSync(f)) raw = fs.readFileSync(f, "utf8");
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw) as MoodMap;
  } catch {
    return {};
  }
}

export async function listPoems(): Promise<Poem[]> {
  let poems: Poem[];
  if (blobsEnabled()) {
    const s = await store("poems");
    const { blobs } = await s.list();
    const keys = blobs.map((b) => b.key).filter((k) => !k.startsWith("__"));
    poems = await Promise.all(
      keys.map(async (key) => fromRaw(key, (await s.get(key, { type: "text" })) ?? "")),
    );
  } else if (fs.existsSync(POEMS_DIR)) {
    poems = fs
      .readdirSync(POEMS_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((file) =>
        fromRaw(file.replace(/\.md$/, ""), fs.readFileSync(path.join(POEMS_DIR, file), "utf8")),
      );
  } else {
    poems = [];
  }

  const moods = await readMoods();
  for (const p of poems) {
    const m = moods[p.slug];
    if (m) {
      p.mood = m.mood;
      p.moodConfidence = m.confidence;
    }
  }
  return poems.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPoem(slug: string): Promise<Poem | null> {
  if (blobsEnabled()) {
    const s = await store("poems");
    const raw = await s.get(slug, { type: "text" });
    return raw ? fromRaw(slug, raw) : null;
  }
  const mdPath = path.join(POEMS_DIR, `${slug}.md`);
  if (!fs.existsSync(mdPath)) return null;
  return fromRaw(slug, fs.readFileSync(mdPath, "utf8"));
}
