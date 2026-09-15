import { NextResponse } from "next/server";
import { clearStats, readJourneys, readStats } from "@/lib/analytics";
import { getAllReactions } from "@/lib/reactions";
import { hasScope } from "@/lib/adminAuth";

export const runtime = "nodejs";

// A stats session (or, on her machine, the key in a header): never the key in
// the address, where it would sit in logs and browser history.
function denyIfBadKey(request: Request): NextResponse | null {
  if (!process.env.STATS_KEY && !process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "stats-unconfigured" }, { status: 503 });
  }
  if (!hasScope(request, "stats")) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

// Private: requires the STATS_KEY env var (set in Netlify + .env.local).
export async function GET(request: Request) {
  const denied = denyIfBadKey(request);
  if (denied) return denied;
  const [stats, reactions, journeys] = await Promise.all([
    readStats(),
    getAllReactions(),
    readJourneys(),
  ]);
  return NextResponse.json({ ...stats, reactions, journeys });
}

// Reset every counter (e.g. to clear your own test visits).
export async function DELETE(request: Request) {
  const denied = denyIfBadKey(request);
  if (denied) return denied;
  await clearStats();
  return NextResponse.json({ ok: true });
}
