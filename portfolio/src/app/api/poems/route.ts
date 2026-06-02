import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { POEM_COOKIE, verifyToken } from "@/lib/auth";
import { listPoems } from "@/lib/poems-store";

export const runtime = "nodejs";

// Returns the poems only when the unlock cookie is valid. The client fetches
// this after the password gate; the page itself never auto-unlocks from the
// cookie, so a refresh always starts locked.
export async function GET() {
  const store = await cookies();
  if (!verifyToken(store.get(POEM_COOKIE)?.value)) {
    return NextResponse.json({ error: "locked" }, { status: 401 });
  }
  const poems = await listPoems();
  return NextResponse.json({ poems });
}
