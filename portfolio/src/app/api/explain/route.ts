import { NextResponse } from "next/server";
import { explainProjects, type Level } from "@/lib/explain";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request) {
  const level = new URL(request.url).searchParams.get("level");
  if (level !== "eli5" && level !== "expert") {
    return NextResponse.json({ error: "bad-level" }, { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "explain-unconfigured" }, { status: 503 });
  }
  try {
    const blurbs = await explainProjects(level as Level);
    return NextResponse.json({ level, blurbs });
  } catch (err) {
    console.error("explain failed", err);
    return NextResponse.json({ error: "explain-failed" }, { status: 500 });
  }
}
