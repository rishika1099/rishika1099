import { NextResponse } from "next/server";
import { buildAutoCaseStudy } from "@/lib/caseStudyAuto";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * The drafted case study for one project, built on first ask and cached after.
 *
 * Public like the pipeline endpoint, and for the same reason: it reads a public
 * readme and writes into a cache keyed by that readme, so the worst a stranger
 * can do is warm a cache. It never touches the authored case studies, which
 * live in their own store.
 */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim().toLowerCase() ?? "";
  if (!/^[a-z0-9._-]{1,80}$/.test(slug)) {
    return NextResponse.json({ error: "bad-slug" }, { status: 400 });
  }
  try {
    return NextResponse.json({ caseStudy: await buildAutoCaseStudy(slug) });
  } catch (err) {
    console.error("case study failed", err);
    return NextResponse.json({ caseStudy: null });
  }
}
