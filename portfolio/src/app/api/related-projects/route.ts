import { NextResponse } from "next/server";
import { relatedProjects } from "@/lib/search";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("name")?.trim() ?? "";
  if (!name) return NextResponse.json({ results: [] });
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "related-unconfigured" }, { status: 503 });
  }
  try {
    const results = await relatedProjects(name);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("related projects failed", err);
    return NextResponse.json({ error: "related-failed" }, { status: 500 });
  }
}
