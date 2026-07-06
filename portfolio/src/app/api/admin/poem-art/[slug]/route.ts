import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import {
  acceptDraft,
  artStatus,
  discardDraft,
  regenerateDraft,
  removeSaved,
  restoreSaved,
  saveCurrent,
  uploadDraft,
} from "@/lib/poemArtStore";

export const runtime = "nodejs";
export const maxDuration = 60; // image generation can take a while

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const denied = guard(request);
  if (denied) return denied;
  const { slug } = await ctx.params;
  try {
    return NextResponse.json(await artStatus(slug));
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}

export async function POST(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  const denied = guard(request);
  if (denied) return denied;
  const { slug } = await ctx.params;
  const type = request.headers.get("content-type") ?? "";

  try {
    // an uploaded image becomes the draft (previewed before it goes live)
    if (type.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "no file" }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      await uploadDraft(slug, buf);
      return NextResponse.json({ ok: true });
    }

    const body = (await request.json()) as { action?: string; id?: string };
    switch (body.action) {
      case "regenerate":
        await regenerateDraft(slug);
        return NextResponse.json({ ok: true });
      case "accept": {
        const ok = await acceptDraft(slug);
        return NextResponse.json({ ok });
      }
      case "discard":
        await discardDraft(slug);
        return NextResponse.json({ ok: true });
      case "save": {
        const entry = await saveCurrent(slug);
        return NextResponse.json({ ok: !!entry, saved: entry });
      }
      case "restore": {
        if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
        const ok = await restoreSaved(slug, body.id);
        return NextResponse.json({ ok });
      }
      case "deleteSaved":
        if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await removeSaved(slug, body.id);
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
