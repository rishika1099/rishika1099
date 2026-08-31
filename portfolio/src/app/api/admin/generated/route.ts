import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { clearStore, countStore } from "@/lib/genCache";

export const runtime = "nodejs";

/**
 * The generated content, and a way to throw it away.
 *
 * Everything a model writes for this site is cached against a hash of what it
 * was written from, so it rebuilds by itself when the source changes. That
 * covers being out of date; it does not cover being badly written, and there
 * has to be a way to say "do that again". Clearing a store costs the next
 * visitor one regeneration and nothing else.
 */
const STORES = [
  { id: "default", label: "project descriptions" },
  { id: "eli5", label: "descriptions, explained simply" },
  { id: "expert", label: "descriptions, for an engineer" },
  { id: "about-default", label: "About card notes" },
  { id: "pipelines", label: "pipeline diagrams" },
  { id: "case-studies-auto", label: "drafted case studies" },
  { id: "angles", label: "experience re-angled per role" },
];

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const stores = await Promise.all(
    STORES.map(async (s) => ({ ...s, count: await countStore(s.id) })),
  );
  return NextResponse.json({ stores });
}

export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const { id } = (await request.json()) as { id?: string };
    if (!id || !STORES.some((s) => s.id === id)) {
      return NextResponse.json({ error: "unknown store" }, { status: 400 });
    }
    await clearStore(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
