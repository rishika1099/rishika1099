import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { readBlogOverrides, saveBlogOverride, type BlogOverride } from "@/lib/blogOverrides";

export const runtime = "nodejs";

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  return NextResponse.json({ overrides: await readBlogOverrides() });
}

const strArr = (v: unknown) =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean)
    : undefined;

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { key?: string } & Record<string, unknown>;
    const key = (body.key ?? "").trim();
    if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });
    const o: BlogOverride = {
      title: typeof body.title === "string" ? body.title : undefined,
      excerpt: typeof body.excerpt === "string" ? body.excerpt : undefined,
      tech: strArr(body.tech) as BlogOverride["tech"],
      domains: strArr(body.domains) as BlogOverride["domains"],
    };
    await saveBlogOverride(key, o);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
