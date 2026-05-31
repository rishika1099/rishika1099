import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();

export interface Doc {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  image?: string;
}

function readDir(dir: string): Doc[] {
  const full = path.join(root, "src", "content", dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(full, file), "utf8");
      const { data, content } = matter(raw);
      return {
        slug: file.replace(/\.md$/, ""),
        title: (data.title as string) ?? file,
        date: (data.date as string) ?? "",
        excerpt: (data.excerpt as string) ?? "",
        content,
        image: (data.image as string) ?? undefined,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getBlogPosts(): Doc[] {
  return readDir("blog");
}

export function getBlogPost(slug: string): Doc | undefined {
  return getBlogPosts().find((d) => d.slug === slug);
}

export function getPoems(): Doc[] {
  return readDir("poems");
}
