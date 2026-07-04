import { NextResponse } from "next/server";
import { readFileKind } from "@/lib/files";

export const runtime = "nodejs";

// Serve the uploaded resume when present, else the one shipped in the repo.
export async function GET(request: Request) {
  const f = await readFileKind("resume");
  if (!f) return NextResponse.redirect(new URL("/Rishika_Resume.pdf", request.url), 307);
  return new NextResponse(new Uint8Array(f.buf), {
    headers: {
      "Content-Type": f.mime,
      "Content-Disposition": 'inline; filename="Rishika_Resume.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
