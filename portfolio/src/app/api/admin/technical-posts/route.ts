import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { getTechnicalPosts } from "@/lib/technicalPosts";

export const runtime = "nodejs";

// The merged Technical Blogs list (local md + rich + auto-pulled Substack),
// used by the atelier's blog manager to list auto-pulled posts to override.
export async function GET(request: Request) {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  const posts = await getTechnicalPosts();
  return NextResponse.json({
    posts: posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      external: p.external ?? null,
      tech: p.tech ?? [],
      domains: p.domains ?? [],
    })),
  });
}
