import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { getResumeTex, saveResumeTex } from "@/lib/resumeSource";
import { writeFileKind } from "@/lib/files";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PDF = 10 * 1024 * 1024; // same cap as the resume upload

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

// Return the current LaTeX source (or the starter template).
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  return NextResponse.json({ tex: await getResumeTex() });
}

// Save the source, and (optionally) the browser-compiled PDF, which then
// becomes what /resume serves. Compilation happens client-side in the editor.
export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { tex?: string; pdfBase64?: string };
    if (typeof body.tex !== "string" || !body.tex.trim()) {
      return NextResponse.json({ error: "tex is required" }, { status: 400 });
    }
    await saveResumeTex(body.tex);

    if (body.pdfBase64) {
      const buf = Buffer.from(body.pdfBase64, "base64");
      if (!buf.length || buf.length > MAX_PDF) {
        return NextResponse.json({ error: "pdf missing or too large" }, { status: 400 });
      }
      // sanity: PDFs start with "%PDF"
      if (buf.subarray(0, 4).toString("latin1") !== "%PDF") {
        return NextResponse.json({ error: "that didn't look like a PDF" }, { status: 400 });
      }
      await writeFileKind("resume", buf, "application/pdf");
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
