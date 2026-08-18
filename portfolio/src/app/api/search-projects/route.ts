import { NextResponse } from "next/server";
import { searchProjects } from "@/lib/search";
import { recordSearch } from "@/lib/analytics";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "search-unconfigured" }, { status: 503 });
  }
  try {
    // log the phrase people searched for (the words only, tied to nobody)
    void recordSearch(q);
    const results = await searchProjects(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("project search failed", err);
    return NextResponse.json({ error: "search-failed" }, { status: 500 });
  }
}
