import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { deleteAttachment, kindForMime, saveAttachment } from "@/lib/attachments";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX = 8 * 1024 * 1024; // 8MB per file

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

// Upload one picture/PDF, returns { id, name, kind } to pin onto an entry.
export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { name?: string; mime?: string; dataBase64?: string };
    const mime = (body.mime ?? "").toLowerCase();
    if (!kindForMime(mime)) {
      return NextResponse.json({ error: "images (jpg/png/webp/gif) or pdf only" }, { status: 400 });
    }
    const buf = Buffer.from(body.dataBase64 ?? "", "base64");
    if (!buf.length || buf.length > MAX) {
      return NextResponse.json({ error: "file missing or larger than 8MB" }, { status: 400 });
    }
    const meta = await saveAttachment(buf, mime, (body.name ?? "file").slice(0, 120));
    return NextResponse.json(meta);
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}

// Remove an uploaded file (best-effort; entries reference it by id).
export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const { id } = (await request.json()) as { id?: string };
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await deleteAttachment(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
