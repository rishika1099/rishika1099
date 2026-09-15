import { NextResponse } from "next/server";
import { SESSION_COOKIE, authMode, createSession, sessionCookieOptions } from "@/lib/adminAuth";
import { checkChallenge } from "@/lib/ownerLogin";
import { allowVisitor } from "@/lib/rateLimit";

export const runtime = "nodejs";

/** Step two: the emailed code, which opens a session cookie. */
export async function POST(request: Request) {
  if (authMode() !== "live") return NextResponse.json({ error: "not-needed" }, { status: 400 });
  let challenge = "";
  let code = "";
  try {
    const body = (await request.json()) as { challenge?: unknown; code?: unknown };
    challenge = typeof body.challenge === "string" ? body.challenge : "";
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
  if (!(await allowVisitor(request, "login-verify", 15, 150, 15 * 60))) {
    return NextResponse.json({ error: "slow-down" }, { status: 429 });
  }

  const result = await checkChallenge(challenge, code);
  if (!result.ok) {
    return NextResponse.json(
      result.reason === "wrong"
        ? { error: "wrong-code", triesLeft: result.triesLeft }
        : { error: result.reason },
      { status: 401 },
    );
  }
  const value = createSession(result.scopes);
  if (!value) return NextResponse.json({ error: "no-session-secret" }, { status: 503 });
  const res = NextResponse.json({ ok: true, scopes: result.scopes });
  res.cookies.set(SESSION_COOKIE, value, sessionCookieOptions);
  return res;
}
