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

// "published" shows now, "draft" never shows publicly, "scheduled" shows once
// publishAt has passed. Posts saved before this field existed have no status,
// which we treat as published (see isLive).
export type PostStatus = "published" | "draft" | "scheduled";

export interface RichPost {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  excerpt: string;
  html: string;
  status?: PostStatus;
  publishAt?: string; // ISO datetime, only meaningful when status === "scheduled"
  pinned?: boolean; // floats to the top of the technical blogs list
  order?: number; // hand-dragged position (lower = earlier)
}

/** Whether a post should be visible to the public right now. */
export function isLive(p: Pick<RichPost, "status" | "publishAt">): boolean {
  if (p.status === "draft") return false;
  if (p.status === "scheduled") return !!p.publishAt && new Date(p.publishAt).getTime() <= Date.now();
  return true; // "published" or legacy posts with no status
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
      return sortPosts(posts.filter((p): p is RichPost => !!p?.slug));
    }
    if (!fs.existsSync(LOCAL_DIR)) return [];
    return sortPosts(
      fs
        .readdirSync(LOCAL_DIR)
        .filter((f) => f.endsWith(".json"))
        .map((f) => JSON.parse(fs.readFileSync(path.join(LOCAL_DIR, f), "utf8")) as RichPost),
    );
  } catch {
    return [];
  }
}

// pinned first, then the hand-dragged order, then newest first
function sortPosts(posts: RichPost[]): RichPost[] {
  return posts.sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    const oa = a.order ?? Number.MAX_SAFE_INTEGER;
    const ob = b.order ?? Number.MAX_SAFE_INTEGER;
    if (oa !== ob) return oa - ob;
    return a.date < b.date ? 1 : -1;
  });
}

/** Persist a drag-and-drop ordering: writes the position onto each post. */
export async function reorderRichPosts(slugs: string[]): Promise<void> {
  const posts = await listRichPosts();
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  await Promise.all(
    slugs.map(async (slug, i) => {
      const p = bySlug.get(slug);
      if (!p || p.order === i) return;
      const next = { ...p, order: i };
      if (blobsEnabled()) {
        const s = await store("blogs");
        await s.setJSON(slug, next);
      } else {
        fs.mkdirSync(LOCAL_DIR, { recursive: true });
        fs.writeFileSync(path.join(LOCAL_DIR, `${slug}.json`), JSON.stringify(next, null, 2));
      }
    }),
  );
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
  status?: PostStatus;
  publishAt?: string;
  pinned?: boolean;
  order?: number;
}): Promise<string> {
  const slug = (p.slug ?? "").trim() || slugify(p.title);
  const html = sanitizeRichHtml(p.html);
  const status: PostStatus = p.status ?? "published";
  const publishAt = (p.publishAt ?? "").trim();
  const post: RichPost = {
    slug,
    title: p.title.trim(),
    date: (p.date ?? "").trim() || new Date().toISOString().slice(0, 10),
    excerpt: (p.excerpt ?? "").trim() || richToText(html, 160),
    html,
    status,
    ...(status === "scheduled" && publishAt ? { publishAt } : {}),
    ...(p.pinned ? { pinned: true } : {}),
    ...(typeof p.order === "number" ? { order: p.order } : {}),
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
  const posts = (await listRichPosts()).filter(isLive);
  return posts.map((p) => {
    const tagText = `${p.title}. ${richToText(p.html, 400)}`;
    return {
      slug: p.slug,
      title: p.title,
      date: p.date,
      excerpt: p.excerpt,
      content: "",
      rich: true,
      pinned: p.pinned,
      order: p.order,
      domains: detectDomains(`${p.title}. ${p.excerpt}`),
      tech: [categorize(tagText)],
    } as Doc;
  });
}
