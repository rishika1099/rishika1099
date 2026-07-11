import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { deletePoem, listPoems, savePoem, savePoemOrder, slugify, type PoemOrder } from "@/lib/poems-store";
import { sanitizeRichHtml } from "@/lib/richHtml";

export const runtime = "nodejs";

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  return NextResponse.json({ poems: await listPoems() });
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
      content?: string;
      rich?: boolean;
      reorder?: PoemOrder;
    };
    // drag-and-drop ordering + pins from the editors
    if (body.reorder) {
      await savePoemOrder(body.reorder);
      return NextResponse.json({ ok: true });
    }
    const title = (body.title ?? "").trim();
    const content = (body.content ?? "").trim();
    if (!title || !content) {
      return NextResponse.json({ error: "title and content are required" }, { status: 400 });
    }
    const slug = (body.slug ?? "").trim() || slugify(title);
    await savePoem({
      slug,
      title,
      date: (body.date ?? "").trim() || new Date().toISOString().slice(0, 10),
      excerpt: (body.excerpt ?? "").trim(),
      content: body.rich ? sanitizeRichHtml(content) : content,
      rich: !!body.rich,
    });
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
    await deletePoem(slug);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
