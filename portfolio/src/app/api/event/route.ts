import { NextResponse } from "next/server";
import { recordEvent, recordVital } from "@/lib/analytics";

export const runtime = "nodejs";

const BOT_RE = /bot|crawl|spider|preview|headless|lighthouse|monitor/i;

// Named events (outbound clicks, downloads, conversions, on-site searches) and
// Core Web Vital samples. Aggregate-only; no identifiers.
export async function POST(request: Request) {
  try {
    if (BOT_RE.test(request.headers.get("user-agent") ?? "")) return NextResponse.json({ ok: true });
    const body = (await request.json()) as { name?: string; value?: number };
    const name = (body.name ?? "").trim();
    if (!name) return NextResponse.json({ ok: true });
    if (typeof body.value === "number" && isFinite(body.value)) {
      await recordVital(name, body.value);
    } else {
      await recordEvent(name);
    }
  } catch {
    // analytics must never break the site
  }
  return NextResponse.json({ ok: true });
}
