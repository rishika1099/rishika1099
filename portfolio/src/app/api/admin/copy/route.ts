import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { copyDefaults } from "@/data/copy";
import { clearCopy, getCopy, saveCopy } from "@/lib/siteCopy";

export const runtime = "nodejs";

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const texts = await getCopy();
  const blocks = Object.entries(copyDefaults).map(([id, b]) => ({
    id,
    page: b.page,
    label: b.label,
    text: texts[id],
    isDefault: texts[id] === b.text,
  }));
  return NextResponse.json({ blocks });
}

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { texts?: Record<string, unknown> };
    if (!body.texts || typeof body.texts !== "object") {
      return NextResponse.json({ error: "texts object required" }, { status: 400 });
    }
    const texts: Record<string, string> = {};
    for (const [k, v] of Object.entries(body.texts)) {
      if (typeof v === "string" && k in copyDefaults) texts[k] = v.slice(0, 4000);
    }
    await saveCopy(texts);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}

// revert every passage to the repo defaults
export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  await clearCopy();
  return NextResponse.json({ ok: true });
}
