import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Category, Domain } from "@/data/projects";

const root = process.cwd();

export interface Doc {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  image?: string;
  // when set, the post lives off-site (e.g. Substack) and cards link out
  external?: string;
  rich?: boolean; // written in the atelier's ink editor (HTML in Blobs)
  // same tag taxonomy as projects: a domain + technical-area tags
  domains?: Domain[];
  tech?: Category[];
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
        external: (data.external as string) ?? undefined,
        domains: (data.domains as Domain[]) ?? undefined,
        tech: (data.tech as Category[]) ?? undefined,
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
