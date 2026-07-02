import { NextResponse } from "next/server";
import { readStats } from "@/lib/analytics";

export const runtime = "nodejs";

// Public per-page view count (visits are already aggregated by VisitPing).
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path") ?? "";
  if (!path.startsWith("/")) return NextResponse.json({ views: 0 });
  try {
    const { visits } = await readStats();
    return NextResponse.json({ views: visits.byPath[path] ?? 0 });
  } catch {
    return NextResponse.json({ views: 0 });
  }
}
