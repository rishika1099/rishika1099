import { NextResponse } from "next/server";
import { readStats } from "@/lib/analytics";

export const runtime = "nodejs";

// Private: requires the STATS_KEY env var (set in Netlify + .env.local).
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  const expected = process.env.STATS_KEY;
  if (!expected) return NextResponse.json({ error: "stats-unconfigured" }, { status: 503 });
  if (key !== expected) return NextResponse.json({ error: "nope" }, { status: 401 });
  return NextResponse.json(await readStats());
}
