import { NextResponse } from "next/server";
import { POEM_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(POEM_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
