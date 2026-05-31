import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface Poem {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  image?: string;
}

export interface PoemInput {
  title: string;
  date?: string;
  excerpt?: string;
  content: string;
}

const POEMS_DIR = path.join(process.cwd(), "src/content/poems");

/**
 * On Netlify the poems live in a private Blobs store (so the confidential
 * text never lands in the public Git repo). Locally we fall back to the
 * gitignored `.md` files so `next dev` keeps working with no extra config.
 */
function blobsEnabled(): boolean {
  return !!(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
}

async function blobStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore("poems");
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

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

function toRaw(poem: Poem): string {
  return matter.stringify(poem.content.trim() + "\n", {
    title: poem.title,
    date: poem.date,
    excerpt: poem.excerpt,
    image: poem.image,
  });
}

// ---------- read ----------

export async function listPoems(): Promise<Poem[]> {
  let poems: Poem[];
  if (blobsEnabled()) {
    const store = await blobStore();
    const { blobs } = await store.list();
    poems = await Promise.all(
      blobs.map(async ({ key }) => {
        const raw = (await store.get(key, { type: "text" })) ?? "";
        return fromRaw(key, raw);
      }),
    );
  } else {
    if (!fs.existsSync(POEMS_DIR)) return [];
    poems = fs
      .readdirSync(POEMS_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((file) =>
        fromRaw(
          file.replace(/\.md$/, ""),
          fs.readFileSync(path.join(POEMS_DIR, file), "utf8"),
        ),
      );
  }
  return poems.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPoem(slug: string): Promise<Poem | null> {
  if (blobsEnabled()) {
    const store = await blobStore();
    const raw = await store.get(slug, { type: "text" });
    return raw ? fromRaw(slug, raw) : null;
  }
  const mdPath = path.join(POEMS_DIR, `${slug}.md`);
  if (!fs.existsSync(mdPath)) return null;
  return fromRaw(slug, fs.readFileSync(mdPath, "utf8"));
}

// ---------- write ----------

export async function savePoem(input: PoemInput, originalSlug?: string): Promise<Poem> {
  const title = input.title.trim();
  if (!title) throw new Error("Title is required");
  if (!input.content.trim()) throw new Error("Poem body is required");

  const slug = slugify(title);
  if (!slug) throw new Error("Could not derive a slug from the title");

  const poem: Poem = {
    slug,
    title,
    date: (input.date || new Date().toISOString().slice(0, 10)).trim(),
    excerpt: (input.excerpt ?? "").trim(),
    content: input.content,
    image: imageFor(slug),
  };

  if (blobsEnabled()) {
    const store = await blobStore();
    await store.set(slug, toRaw(poem));
    if (originalSlug && originalSlug !== slug) await store.delete(originalSlug);
  } else {
    fs.mkdirSync(POEMS_DIR, { recursive: true });
    fs.writeFileSync(path.join(POEMS_DIR, `${slug}.md`), toRaw(poem));
    if (originalSlug && originalSlug !== slug) {
      const old = path.join(POEMS_DIR, `${originalSlug}.md`);
      if (fs.existsSync(old)) fs.rmSync(old);
    }
  }
  return poem;
}

export async function deletePoem(slug: string): Promise<void> {
  if (blobsEnabled()) {
    const store = await blobStore();
    await store.delete(slug);
  } else {
    const mdPath = path.join(POEMS_DIR, `${slug}.md`);
    if (fs.existsSync(mdPath)) fs.rmSync(mdPath);
  }
}
