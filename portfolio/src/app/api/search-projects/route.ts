import { NextResponse } from "next/server";
import { searchProjects } from "@/lib/search";
import { recordSearch } from "@/lib/analytics";
import { allowVisitor } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "search-unconfigured" }, { status: 503 });
  }
  // each query is embedded by a paid model; the search box fires as people type
  if (!(await allowVisitor(request, "search", 300, 6000, 24 * 3600))) {
    return NextResponse.json({ error: "busy" }, { status: 429 });
  }
  try {
    // log the phrase people searched for (the words only, tied to nobody)
    // the tour searches too; its queries are not real interest
    if (!request.headers.get("x-no-track")) void recordSearch(q);
    const results = await searchProjects(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("project search failed", err);
    return NextResponse.json({ error: "search-failed" }, { status: 500 });
  }
}
