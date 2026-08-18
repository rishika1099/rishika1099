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
    let extra: {
      campaign?: string;
      refPath?: string;
      entry?: string;
      lang?: string;
      timezone?: string;
      viewport?: string;
    } = {};
    try {
      const body = (await request.json()) as {
        path?: string;
        referrer?: string;
        visitor?: string;
        sid?: string;
        campaign?: string;
        refPath?: string;
        entry?: string;
        lang?: string;
        timezone?: string;
        viewport?: string;
      };
      path = (body.path ?? "/").slice(0, 200);
      referrer = body.referrer;
      sid = typeof body.sid === "string" ? body.sid : undefined;
      if (body.visitor === "new" || body.visitor === "returning") visitor = body.visitor;
      const str = (v: unknown, max = 80) =>
        typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
      extra = {
        campaign: str(body.campaign),
        refPath: str(body.refPath, 160),
        entry: str(body.entry, 200),
        lang: str(body.lang, 12),
        timezone: str(body.timezone, 60),
        viewport: str(body.viewport, 16),
      };
    } catch {
      // beacon without a body: count it against the root
    }
    // never log the private stats page
    if (path.startsWith("/stats")) return NextResponse.json({ ok: true });

    const { country, city } = geoFromHeaders(request.headers);
    const { device, browser, os } = parseUA(ua);
    const ref = refHost(referrer, new URL(request.url).hostname) ?? undefined;
    await recordVisit({ path, country, city, referrer: ref, device, browser, os, visitor, ...extra });
    if (sid) await recordJourney(sid, path, { city, country });
  } catch {
    // analytics must never break the site
  }
  return NextResponse.json({ ok: true });
}
