import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import {
  deleteFileKind,
  getPortraitFrame,
  readFileKind,
  setPortraitFrame,
  writeFileKind,
  type FileKind,
} from "@/lib/files";
import { cleanFrame } from "@/lib/frame";
import { purgeTag } from "@/lib/cdnPurge";
import { ICON_TAG } from "@/lib/siteIcon";

export const runtime = "nodejs";
export const maxDuration = 60;

const LIMITS: Record<FileKind, { mimes: Record<string, string>; max: number }> = {
  resume: { mimes: { pdf: "application/pdf" }, max: 10 * 1024 * 1024 },
  portrait: {
    mimes: { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" },
    max: 8 * 1024 * 1024,
  },
  // the tab icon, and its white-ground twin for an iPhone's home screen
  icon: { mimes: { png: "image/png" }, max: 1024 * 1024 },
  "icon-apple": { mimes: { png: "image/png" }, max: 1024 * 1024 },
};

const isKind = (k: unknown): k is FileKind => typeof k === "string" && Object.hasOwn(LIMITS, k);

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const [resume, portrait, icon, frame] = await Promise.all([
    readFileKind("resume"),
    readFileKind("portrait"),
    readFileKind("icon"),
    getPortraitFrame(),
  ]);
  return NextResponse.json({ resume: !!resume, portrait: !!portrait, icon: !!icon, frame });
}

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { kind?: string; ext?: string; dataBase64?: string };
    const kind = body.kind;
    if (!isKind(kind)) {
      return NextResponse.json({ error: "unknown kind of file" }, { status: 400 });
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
    if (kind === "portrait") {
      // a new photo was framed for a different picture; start it centred.
      // The photo is saved by now, so a hiccup here is not a failed upload.
      await setPortraitFrame(null).catch(() => {});
      await purgeTag("portrait");
    }
    if (kind === "icon" || kind === "icon-apple") await purgeTag(ICON_TAG);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}

// Save how the portrait sits in its circle; a null frame centres it again.
export async function PATCH(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const { frame } = (await request.json()) as { frame?: unknown };
    const clean = frame === null ? null : cleanFrame(frame);
    if (frame !== null && !clean) {
      return NextResponse.json({ error: "frame needs x, y and zoom" }, { status: 400 });
    }
    await setPortraitFrame(clean);
    return NextResponse.json({ ok: true, frame: clean });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const { kind } = (await request.json()) as { kind?: unknown };
    if (!isKind(kind)) {
      return NextResponse.json({ error: "kind required" }, { status: 400 });
    }
    await deleteFileKind(kind);
    if (kind === "icon") {
      // the two are one icon in two dresses; they go back together
      await deleteFileKind("icon-apple");
      await purgeTag(ICON_TAG);
    }
    if (kind === "portrait") {
      await setPortraitFrame(null).catch(() => {});
      await purgeTag("portrait");
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
