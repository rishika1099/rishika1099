import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { copyDefaults } from "@/data/copy";
import {
  clearCopy,
  getCopy,
  hasBaseline,
  promoteBaseline,
  resetCopyToCode,
  saveCopy,
} from "@/lib/siteCopy";
import { sanitizeRichHtml } from "@/lib/richHtml";

export const runtime = "nodejs";

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const [texts, pinned] = await Promise.all([getCopy(), hasBaseline()]);
  const blocks = Object.entries(copyDefaults).map(([id, b]) => ({
    id,
    page: b.page,
    label: b.label,
    text: texts[id],
    // "default" means it currently matches its fallback (baseline or code)
    isDefault: texts[id] === b.text,
  }));
  return NextResponse.json({ blocks, hasBaseline: pinned });
}

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as {
      texts?: Record<string, unknown>;
      // pin the current edits as the new default; optional ids scope it to a page
      promote?: boolean;
      ids?: unknown;
    };

    if (body.promote) {
      const ids = Array.isArray(body.ids)
        ? body.ids.filter((x): x is string => typeof x === "string")
        : undefined;
      await promoteBaseline(ids);
      return NextResponse.json({ ok: true, promoted: true });
    }

    if (!body.texts || typeof body.texts !== "object") {
      return NextResponse.json({ error: "texts object required" }, { status: 400 });
    }
    // merge over the current state so a per-page save never wipes other pages
    const texts = await getCopy();
    for (const [k, v] of Object.entries(body.texts)) {
      if (typeof v === "string" && k in copyDefaults) texts[k] = sanitizeRichHtml(v).slice(0, 8000);
    }
    await saveCopy(texts);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}

// Revert edits to the current default (your pinned baseline, else the code).
// ?hard=1 also wipes the baseline, going all the way back to the repo code.
export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const params = new URL(request.url).searchParams;
  if (params.get("hard") === "1") {
    await resetCopyToCode();
  } else {
    // ?ids=a,b,c reverts only those blocks (a single page's edit room)
    const idsParam = params.get("ids");
    const ids = idsParam ? idsParam.split(",").filter(Boolean) : undefined;
    await clearCopy(ids);
  }
  return NextResponse.json({ ok: true });
}
