import { NextResponse } from "next/server";
import { buildPipeline } from "@/lib/pipeline";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * The diagram for one project, built on first ask and cached forever after.
 *
 * Public and unauthenticated, like the explain endpoint: it reads a public
 * readme and writes into a cache keyed by that readme, so the worst a stranger
 * can do is warm a cache she wanted warm. The slug is matched against the real
 * project list rather than passed anywhere, so it cannot address anything else.
 */
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim().toLowerCase() ?? "";
  if (!/^[a-z0-9._-]{1,80}$/.test(slug)) {
    return NextResponse.json({ error: "bad-slug" }, { status: 400 });
  }
  try {
    const pipeline = await buildPipeline(slug);
    return NextResponse.json({ pipeline });
  } catch (err) {
    console.error("pipeline failed", err);
    // a missing picture is not worth a broken card
    return NextResponse.json({ pipeline: null });
  }
}
