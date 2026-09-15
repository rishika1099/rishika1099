import { NextResponse } from "next/server";
import { authMode, sessionScopes } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Whether this request already holds a session, and which kind of login applies. */
export async function GET(request: Request) {
  const mode = authMode();
  return NextResponse.json(
    { mode, scopes: mode === "live" ? sessionScopes(request) : [] },
    { headers: { "Cache-Control": "no-store" } },
  );
}
