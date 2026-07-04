import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { clearContactLinks, getContactLinks, saveContactLinks, type ContactLink } from "@/lib/contactLinks";

export const runtime = "nodejs";

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  return NextResponse.json({ links: await getContactLinks() });
}

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { links?: unknown[] };
    if (!Array.isArray(body.links)) {
      return NextResponse.json({ error: "links array required" }, { status: 400 });
    }
    const links = body.links
      .map((l) => {
        const o = l as ContactLink;
        return {
          icon: String(o.icon ?? "✨").slice(0, 8),
          label: String(o.label ?? "").trim().slice(0, 40),
          value: String(o.value ?? "").trim().slice(0, 80),
          href: String(o.href ?? "").trim().slice(0, 200),
        };
      })
      .filter((l) => l.label && l.href);
    if (!links.length) return NextResponse.json({ error: "at least one link" }, { status: 400 });
    await saveContactLinks(links);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  await clearContactLinks();
  return NextResponse.json({ ok: true });
}
