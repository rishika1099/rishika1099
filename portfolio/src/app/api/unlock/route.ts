import { NextResponse } from "next/server";
import { checkPassword, createToken, POEM_COOKIE, cookieOptions } from "@/lib/auth";
import { allowVisitor } from "@/lib/rateLimit";

export async function POST(request: Request) {
  let password = "";
  try {
    const body = await request.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  if (!process.env.POEMS_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "The poem garden isn't configured yet." },
      { status: 503 }
    );
  }

  // Counted before the check, so right and wrong guesses cost the same: without
  // this, a short password could be walked through word by word.
  if (!(await allowVisitor(request, "unlock", 10, 200, 3600))) {
    return NextResponse.json(
      { ok: false, error: "That's a lot of guesses. Rest a little and try again in an hour ✦" },
      { status: 429 },
    );
  }

  if (!checkPassword(password)) {
    return NextResponse.json(
      { ok: false, error: "That's not quite the secret word ✦" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(POEM_COOKIE, createToken(), cookieOptions);
  return res;
}
