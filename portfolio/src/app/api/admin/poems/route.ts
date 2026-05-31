import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";
import { deletePoem, listPoems, savePoem } from "@/lib/poems-store";
import { ensurePoemArt } from "@/lib/poemArt";

export const runtime = "nodejs";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "Locked" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, poems: await listPoems() });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "Locked" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  try {
    const poem = await savePoem(
      {
        title: String(body.title ?? ""),
        date: body.date ? String(body.date) : undefined,
        excerpt: body.excerpt ? String(body.excerpt) : undefined,
        content: String(body.content ?? ""),
      },
      body.originalSlug ? String(body.originalSlug) : undefined,
    );

    // Generate the symbolic art once, right when the poem is added. ensurePoemArt
    // reuses any cached image, so existing poems are never regenerated. Best-effort:
    // a generation hiccup shouldn't fail the save (the art route can retry lazily).
    try {
      await ensurePoemArt(poem.slug);
    } catch (artErr) {
      console.error("Poem art generation failed for", poem.slug, artErr);
    }

    return NextResponse.json({ ok: true, poem });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not save";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "Locked" }, { status: 401 });
  }

  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });
  }
  await deletePoem(slug);
  return NextResponse.json({ ok: true });
}
