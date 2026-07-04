import { NextResponse } from "next/server";
import { readFileKind } from "@/lib/files";

export const runtime = "nodejs";

// Serve the uploaded portrait when present, else the GitHub avatar.
export async function GET() {
  const f = await readFileKind("portrait");
  if (!f) return NextResponse.redirect("https://github.com/rishika1099.png", 307);
  return new NextResponse(new Uint8Array(f.buf), {
    headers: { "Content-Type": f.mime, "Cache-Control": "no-store" },
  });
}
