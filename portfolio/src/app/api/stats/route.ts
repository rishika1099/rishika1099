import { NextResponse } from "next/server";
import { clearStats, readStats } from "@/lib/analytics";
import { getAllReactions } from "@/lib/reactions";

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
  const [stats, reactions] = await Promise.all([readStats(), getAllReactions()]);
  return NextResponse.json({ ...stats, reactions });
}

// Reset every counter (e.g. to clear your own test visits).
export async function DELETE(request: Request) {
  const denied = denyIfBadKey(request);
  if (denied) return denied;
  await clearStats();
  return NextResponse.json({ ok: true });
}
