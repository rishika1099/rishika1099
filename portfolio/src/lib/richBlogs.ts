// Blog posts written in the atelier's ink editor. They live in Netlify Blobs
// (a gitignored local folder in dev) as sanitized rich HTML, and are merged
// into the Technical Blogs page alongside the markdown + Substack posts.

import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";
import { sanitizeRichHtml, richToText } from "@/lib/richHtml";
import { slugify } from "@/lib/poems-store";
import { categorize, detectDomains } from "@/lib/github-projects";
import type { Doc } from "@/lib/content";

export interface RichPost {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  excerpt: string;
  html: string;
}

const LOCAL_DIR = path.join(process.cwd(), "src/content/blog-rich");

export async function listRichPosts(): Promise<RichPost[]> {
  try {
    if (blobsEnabled()) {
      const s = await store("blogs");
      const { blobs } = await s.list();
      const posts = await Promise.all(
        blobs.map(async (b) => (await s.get(b.key, { type: "json" })) as RichPost | null),
      );
      return posts.filter((p): p is RichPost => !!p?.slug);
    }
    if (!fs.existsSync(LOCAL_DIR)) return [];
    return fs
      .readdirSync(LOCAL_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(fs.readFileSync(path.join(LOCAL_DIR, f), "utf8")) as RichPost);
  } catch {
    return [];
  }
}

export async function getRichPost(slug: string): Promise<RichPost | null> {
  try {
    if (blobsEnabled()) {
      const s = await store("blogs");
      return ((await s.get(slug, { type: "json" })) as RichPost) ?? null;
    }
    const f = path.join(LOCAL_DIR, `${slug}.json`);
    return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf8")) as RichPost) : null;
  } catch {
    return null;
  }
}

export async function saveRichPost(p: {
  slug?: string;
  title: string;
  date?: string;
  excerpt?: string;
  html: string;
}): Promise<string> {
  const slug = (p.slug ?? "").trim() || slugify(p.title);
  const html = sanitizeRichHtml(p.html);
  const post: RichPost = {
    slug,
    title: p.title.trim(),
    date: (p.date ?? "").trim() || new Date().toISOString().slice(0, 10),
    excerpt: (p.excerpt ?? "").trim() || richToText(html, 160),
    html,
  };
  if (blobsEnabled()) {
    const s = await store("blogs");
    await s.setJSON(slug, post);
  } else {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_DIR, `${slug}.json`), JSON.stringify(post, null, 2));
  }
  return slug;
}

export async function deleteRichPost(slug: string): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("blogs");
    await s.delete(slug);
  } else {
    const f = path.join(LOCAL_DIR, `${slug}.json`);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}

/** Rich posts shaped as blog Docs for the Technical Blogs list. */
export async function richPostDocs(): Promise<Doc[]> {
  const posts = await listRichPosts();
  return posts.map((p) => {
    const tagText = `${p.title}. ${richToText(p.html, 400)}`;
    return {
      slug: p.slug,
      title: p.title,
      date: p.date,
      excerpt: p.excerpt,
      content: "",
      rich: true,
      domains: detectDomains(`${p.title}. ${p.excerpt}`),
      tech: [categorize(tagText)],
    } as Doc;
  });
}
