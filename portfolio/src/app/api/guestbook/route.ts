import { NextResponse } from "next/server";
import { addGuestEntry, listGuestbook } from "@/lib/guestbook";

export const runtime = "nodejs";

const BOT_RE = /bot|crawl|spider|preview|headless|lighthouse|monitor/i;

export async function GET() {
  return NextResponse.json({ entries: await listGuestbook() });
}

export async function POST(request: Request) {
  try {
    if (BOT_RE.test(request.headers.get("user-agent") ?? "")) {
      return NextResponse.json({ ok: true });
    }
    const body = (await request.json()) as { name?: string; message?: string; website?: string };
    // honeypot: real people never fill a hidden "website" field
    if (body.website) return NextResponse.json({ ok: true });
    const message = (body.message ?? "").trim();
    if (message.length < 2) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }
    const entry = await addGuestEntry(body.name ?? "", message);
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
