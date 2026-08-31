import { NextResponse } from "next/server";
import { MAX_JD, tailorTo } from "@/lib/tailor";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Answer a job posting with her material.
 *
 * POST rather than GET: a posting is long, often several thousand characters,
 * and it has no business sitting in a URL, a log line or a referrer header.
 * Nothing is stored: the posting is read, answered, and forgotten.
 */
export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  }
  try {
    const { jd } = (await request.json()) as { jd?: unknown };
    const posting = typeof jd === "string" ? jd.trim() : "";
    // No floor. "healthcare llm" is a perfectly good thing to type, and telling
    // someone their question is too short is a worse answer than a broad one.
    if (!posting) return NextResponse.json({ error: "empty" }, { status: 400 });
    return NextResponse.json({ tailored: await tailorTo(posting.slice(0, MAX_JD)) });
  } catch (err) {
    console.error("tailor failed", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
