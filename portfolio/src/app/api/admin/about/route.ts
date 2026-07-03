import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { clearAboutEntries, getAboutEntries, saveAboutEntries } from "@/lib/aboutData";
import type { Entry } from "@/data/about";

export const runtime = "nodejs";

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const strArr = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : undefined;

function cleanEntry(e: unknown): Entry | null {
  const o = e as Record<string, unknown>;
  if (!o || typeof o !== "object") return null;
  const title = str(o.title).trim();
  if (!title) return null;
  const entry: Entry = {
    icon: str(o.icon).trim() || "✨",
    when: str(o.when).trim(),
    title,
    place: str(o.place).trim(),
    note: str(o.note).trim(),
  };
  const details = strArr(o.details)?.map((d) => d.trim()).filter(Boolean);
  if (details?.length) entry.details = details;
  const domains = strArr(o.domains)?.map((d) => d.trim()).filter(Boolean);
  if (domains?.length) entry.domains = domains as Entry["domains"];
  const tech = strArr(o.tech)?.map((t) => t.trim()).filter(Boolean);
  if (tech?.length) entry.tech = tech as Entry["tech"];
  return entry;
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  return NextResponse.json(await getAboutEntries());
}

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { education?: unknown[]; timeline?: unknown[] };
    if (!Array.isArray(body.education) || !Array.isArray(body.timeline)) {
      return NextResponse.json({ error: "education and timeline arrays required" }, { status: 400 });
    }
    const education = body.education.map(cleanEntry).filter((e): e is Entry => e !== null);
    const timeline = body.timeline.map(cleanEntry).filter((e): e is Entry => e !== null);
    if (!education.length || !timeline.length) {
      return NextResponse.json({ error: "entries need at least a title" }, { status: 400 });
    }
    await saveAboutEntries({ education, timeline });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}

// revert to the repo defaults
export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  await clearAboutEntries();
  return NextResponse.json({ ok: true });
}
