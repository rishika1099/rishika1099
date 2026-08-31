import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import {
  deleteCaseStudy,
  getCaseStudy,
  listCaseStudies,
  saveCaseStudy,
  type CaseMetric,
} from "@/lib/caseStudies";

export const runtime = "nodejs";

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

/** All of them, or one by ?slug=. */
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const slug = new URL(request.url).searchParams.get("slug");
  if (slug) return NextResponse.json({ caseStudy: await getCaseStudy(slug) });
  return NextResponse.json({ caseStudies: await listCaseStudies() });
}

const metrics = (v: unknown): CaseMetric[] =>
  Array.isArray(v)
    ? v
        .map((m) => m as Record<string, unknown>)
        .filter((m) => m && typeof m === "object")
        .map((m) => ({
          label: typeof m.label === "string" ? m.label : "",
          value: typeof m.value === "string" ? m.value : "",
        }))
    : [];

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const slug = typeof body.slug === "string" ? body.slug : "";
    if (!slug.trim()) return NextResponse.json({ error: "slug required" }, { status: 400 });
    await saveCaseStudy({
      slug,
      tagline: typeof body.tagline === "string" ? body.tagline : "",
      metrics: metrics(body.metrics),
      body: typeof body.body === "string" ? body.body : "",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const { slug } = (await request.json()) as { slug?: string };
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
    await deleteCaseStudy(slug);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
