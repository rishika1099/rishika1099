import { NextResponse } from "next/server";
import { readAttachment } from "@/lib/attachments";

export const runtime = "nodejs";

// Public: serves an entry's attached image/PDF (shown on the About page).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await readAttachment(id);
  if (!f) return NextResponse.json({ error: "not found" }, { status: 404 });
  return new NextResponse(new Uint8Array(f.buf), {
    headers: {
      "Content-Type": f.mime,
      "Content-Disposition": `inline; filename="${f.name.replace(/[^\w.\- ]/g, "_")}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
