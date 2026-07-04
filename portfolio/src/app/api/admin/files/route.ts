import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { deleteFileKind, readFileKind, writeFileKind, type FileKind } from "@/lib/files";

export const runtime = "nodejs";
export const maxDuration = 60;

const LIMITS: Record<FileKind, { mimes: Record<string, string>; max: number }> = {
  resume: { mimes: { pdf: "application/pdf" }, max: 10 * 1024 * 1024 },
  portrait: {
    mimes: { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" },
    max: 8 * 1024 * 1024,
  },
};

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const [resume, portrait] = await Promise.all([readFileKind("resume"), readFileKind("portrait")]);
  return NextResponse.json({ resume: !!resume, portrait: !!portrait });
}

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { kind?: string; ext?: string; dataBase64?: string };
    const kind = body.kind as FileKind;
    if (kind !== "resume" && kind !== "portrait") {
      return NextResponse.json({ error: "kind must be resume or portrait" }, { status: 400 });
    }
    const spec = LIMITS[kind];
    const ext = (body.ext ?? "").toLowerCase().replace(/^\./, "");
    const mime = spec.mimes[ext];
    if (!mime) {
      return NextResponse.json(
        { error: `allowed: ${Object.keys(spec.mimes).join(", ")}` },
        { status: 400 },
      );
    }
    const buf = Buffer.from(body.dataBase64 ?? "", "base64");
    if (!buf.length || buf.length > spec.max) {
      return NextResponse.json({ error: "file missing or too large" }, { status: 400 });
    }
    await writeFileKind(kind, buf, mime);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const { kind } = (await request.json()) as { kind?: FileKind };
    if (kind !== "resume" && kind !== "portrait") {
      return NextResponse.json({ error: "kind required" }, { status: 400 });
    }
    await deleteFileKind(kind);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
