import { NextResponse } from "next/server";
import {
  checkAdminPassword,
  createAdminToken,
  ADMIN_COOKIE,
  cookieOptions,
} from "@/lib/auth";

export async function POST(request: Request) {
  let password = "";
  try {
    const body = await request.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "The editor isn't configured yet." },
      { status: 503 },
    );
  }

  if (!checkAdminPassword(password)) {
    return NextResponse.json(
      { ok: false, error: "That's not the key to this room ✦" },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createAdminToken(), cookieOptions);
  return res;
}
