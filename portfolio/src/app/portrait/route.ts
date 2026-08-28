import { NextResponse } from "next/server";
import { readFileKind } from "@/lib/files";

export const runtime = "nodejs";

// Long enough that the hero image is free on repeat visits, short enough that a
// new portrait uploaded in the atelier shows up while you are still looking at
// it. stale-while-revalidate means nobody ever waits on the refresh.
const CACHE = "public, max-age=60, stale-while-revalidate=86400";
const AVATAR = "https://github.com/rishika1099.png";

// Serve the uploaded portrait when present, else the GitHub avatar.
export async function GET() {
  const f = await readFileKind("portrait");
  if (f) {
    return new NextResponse(new Uint8Array(f.buf), {
      headers: { "Content-Type": f.mime, "Cache-Control": CACHE },
    });
  }

  // Without an uploaded portrait this used to answer with a redirect, which
  // made the homepage's hero image cost a serverless hop, then a fresh DNS
  // lookup and TLS handshake to another origin, before a single pixel arrived,
  // on every visit, because the response was also marked no-store. Serving the
  // bytes ourselves keeps it to one cached request to one origin.
  try {
    const res = await fetch(AVATAR, { next: { revalidate: 86400 } });
    if (res.ok) {
      return new NextResponse(new Uint8Array(await res.arrayBuffer()), {
        headers: {
          "Content-Type": res.headers.get("content-type") ?? "image/png",
          "Cache-Control": CACHE,
        },
      });
    }
  } catch {
    // fall through to the redirect below
  }
  return NextResponse.redirect(AVATAR, 307);
}
