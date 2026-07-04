// One merged view of the Technical Blogs list: local markdown posts, rich
// posts written in the atelier, and auto-pulled Substack posts (deduped).

import { getBlogPosts } from "@/lib/content";
import { getSubstackPosts } from "@/lib/substack";
import { richPostDocs } from "@/lib/richBlogs";
import { externalKey, readBlogOverrides } from "@/lib/blogOverrides";
import type { Doc } from "@/lib/content";

const postSlug = (url?: string) => url?.match(/\/p\/([^/?#]+)/)?.[1];

export async function getTechnicalPosts(): Promise<Doc[]> {
  const local = getBlogPosts();
  const rich = await richPostDocs();
  const localSlugs = new Set(local.map((p) => postSlug(p.external)).filter(Boolean));
  const substack = (await getSubstackPosts()).filter(
    (s) => !localSlugs.has(postSlug(s.external)),
  );
  // her edits win over the automatic RSS values; empty = automatic
  const overrides = await readBlogOverrides();
  const withOverrides = [...local, ...rich, ...substack].map((p) => {
    const o = overrides[externalKey(p.external)];
    if (!o) return p;
    return {
      ...p,
      title: o.title ?? p.title,
      excerpt: o.excerpt ?? p.excerpt,
      tech: o.tech?.length ? o.tech : p.tech,
      domains: o.domains?.length ? o.domains : p.domains,
    };
  });
  return withOverrides.sort(
    (a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0),
  );
}
