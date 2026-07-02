import { NextResponse } from "next/server";
import { geoFromHeaders, recordVisit } from "@/lib/analytics";

export const runtime = "nodejs";

const BOT_RE = /bot|crawl|spider|preview|headless|lighthouse|monitor/i;

export async function POST(request: Request) {
  try {
    const ua = request.headers.get("user-agent") ?? "";
    if (BOT_RE.test(ua)) return NextResponse.json({ ok: true });

    let path = "/";
    try {
      const body = (await request.json()) as { path?: string };
      path = (body.path ?? "/").slice(0, 200);
    } catch {
      // beacon without a body: count it against the root
    }
    // never log the private stats page
    if (path.startsWith("/stats")) return NextResponse.json({ ok: true });

    const { country, city } = geoFromHeaders(request.headers);
    await recordVisit({ path, country, city });
  } catch {
    // analytics must never break the site
  }
  return NextResponse.json({ ok: true });
}
