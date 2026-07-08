import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { listGuestbookAll, removeGuestEntry, setGuestHidden } from "@/lib/guestbook";

export const runtime = "nodejs";

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

// every entry, including hidden ones
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  return NextResponse.json({ entries: await listGuestbookAll() });
}

// moderate: { action: "hide" | "show" | "delete", id }
export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { action?: string; id?: string };
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    if (body.action === "hide") await setGuestHidden(body.id, true);
    else if (body.action === "show") await setGuestHidden(body.id, false);
    else if (body.action === "delete") await removeGuestEntry(body.id);
    else return NextResponse.json({ error: "unknown action" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
