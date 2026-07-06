import { NextResponse } from "next/server";
import { clearStats, readStats } from "@/lib/analytics";

export const runtime = "nodejs";

function denyIfBadKey(request: Request): NextResponse | null {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  const expected = process.env.STATS_KEY;
  if (!expected) return NextResponse.json({ error: "stats-unconfigured" }, { status: 503 });
  if (key !== expected) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

// Private: requires the STATS_KEY env var (set in Netlify + .env.local).
export async function GET(request: Request) {
  const denied = denyIfBadKey(request);
  if (denied) return denied;
  return NextResponse.json(await readStats());
}

// Reset every counter (e.g. to clear your own test visits).
export async function DELETE(request: Request) {
  const denied = denyIfBadKey(request);
  if (denied) return denied;
  await clearStats();
  return NextResponse.json({ ok: true });
}
