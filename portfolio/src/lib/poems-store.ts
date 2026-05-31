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

/**
 * Poems live as `.md` files in this local folder, which is gitignored so the
 * confidential text never lands in the public Git repo. Drop a new `.md` in
 * here to add a poem.
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

export function listPoems(): Poem[] {
  if (!fs.existsSync(POEMS_DIR)) return [];
  return fs
    .readdirSync(POEMS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((file) =>
      fromRaw(file.replace(/\.md$/, ""), fs.readFileSync(path.join(POEMS_DIR, file), "utf8")),
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPoem(slug: string): Poem | null {
  const mdPath = path.join(POEMS_DIR, `${slug}.md`);
  if (!fs.existsSync(mdPath)) return null;
  return fromRaw(slug, fs.readFileSync(mdPath, "utf8"));
}
