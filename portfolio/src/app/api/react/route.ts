import { NextResponse } from "next/server";
import { getReactions, react, type ReactionKind } from "@/lib/reactions";

export const runtime = "nodejs";

const BOT_RE = /bot|crawl|spider|preview|headless|lighthouse|monitor/i;
const isKind = (k: unknown): k is ReactionKind => k === "heart" || k === "sparkle";

// GET ?id=poem:slug  -> current counts for one item
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ heart: 0, sparkle: 0 });
  return NextResponse.json(await getReactions(id));
}

// POST { id, kind, delta } -> add/remove one reaction (aggregate, no identifiers)
export async function POST(request: Request) {
  try {
    if (BOT_RE.test(request.headers.get("user-agent") ?? "")) {
      return NextResponse.json({ heart: 0, sparkle: 0 });
    }
    const body = (await request.json()) as { id?: string; kind?: string; delta?: number };
    const id = (body.id ?? "").trim();
    if (!id || !isKind(body.kind)) return NextResponse.json({ error: "bad-request" }, { status: 400 });
    const counts = await react(id, body.kind, body.delta ?? 1);
    return NextResponse.json(counts);
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
