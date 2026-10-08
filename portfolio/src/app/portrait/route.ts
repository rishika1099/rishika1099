import { NextResponse } from "next/server";
import { readFileKind } from "@/lib/files";

export const runtime = "nodejs";

// The CDN keeps the portrait and refreshes it in the background, so nobody
// waits on it; an upload purges it by its tag (see cdnPurge.ts), so a new photo
// does not wait for that refresh. Browsers get the short lifetime only: a
// browser serving its own stale copy is the one cache an upload cannot clear.
const HEADERS = {
  "Cache-Control": "public, max-age=60",
  "Netlify-CDN-Cache-Control": "public, max-age=60, stale-while-revalidate=86400, durable",
  "Netlify-Cache-Tag": "portrait",
};
const AVATAR = "https://github.com/rishika1099.png";

// Serve the uploaded portrait when present, else the GitHub avatar.
export async function GET() {
  const f = await readFileKind("portrait");
  if (f) {
    return new NextResponse(new Uint8Array(f.buf), {
      headers: { "Content-Type": f.mime, ...HEADERS },
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
        headers: { "Content-Type": res.headers.get("content-type") ?? "image/png", ...HEADERS },
      });
    }
  } catch {
    // fall through to the redirect below
  }
  return NextResponse.redirect(AVATAR, 307);
}
