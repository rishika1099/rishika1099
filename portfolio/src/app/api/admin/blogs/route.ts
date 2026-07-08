import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { deleteRichPost, listRichPosts, saveRichPost } from "@/lib/richBlogs";

export const runtime = "nodejs";

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  return NextResponse.json({ posts: await listRichPosts() });
}

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as {
      slug?: string;
      title?: string;
      date?: string;
      excerpt?: string;
      html?: string;
      status?: "published" | "draft" | "scheduled";
      publishAt?: string;
    };
    const title = (body.title ?? "").trim();
    const html = (body.html ?? "").trim();
    if (!title || !html) {
      return NextResponse.json({ error: "title and body are required" }, { status: 400 });
    }
    const slug = await saveRichPost({ ...body, title, html });
    return NextResponse.json({ ok: true, slug });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const { slug } = (await request.json()) as { slug?: string };
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
    await deleteRichPost(slug);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
