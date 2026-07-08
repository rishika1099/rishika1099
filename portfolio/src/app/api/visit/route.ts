import { NextResponse } from "next/server";
import { geoFromHeaders, parseUA, recordJourney, recordVisit, refHost } from "@/lib/analytics";

export const runtime = "nodejs";

const BOT_RE = /bot|crawl|spider|preview|headless|lighthouse|monitor/i;

export async function POST(request: Request) {
  try {
    const ua = request.headers.get("user-agent") ?? "";
    if (BOT_RE.test(ua)) return NextResponse.json({ ok: true });

    let path = "/";
    let referrer: string | undefined;
    let visitor: "new" | "returning" | undefined;
    let sid: string | undefined;
    try {
      const body = (await request.json()) as {
        path?: string;
        referrer?: string;
        visitor?: string;
        sid?: string;
      };
      path = (body.path ?? "/").slice(0, 200);
      referrer = body.referrer;
      sid = typeof body.sid === "string" ? body.sid : undefined;
      if (body.visitor === "new" || body.visitor === "returning") visitor = body.visitor;
    } catch {
      // beacon without a body: count it against the root
    }
    // never log the private stats page
    if (path.startsWith("/stats")) return NextResponse.json({ ok: true });

    const { country, city } = geoFromHeaders(request.headers);
    const { device, browser, os } = parseUA(ua);
    const ref = refHost(referrer, new URL(request.url).hostname) ?? undefined;
    await recordVisit({ path, country, city, referrer: ref, device, browser, os, visitor });
    if (sid) await recordJourney(sid, path, { city, country });
  } catch {
    // analytics must never break the site
  }
  return NextResponse.json({ ok: true });
}
