import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { getAllProjects } from "@/lib/github-projects";
import {
  clearProjectOverride,
  readProjectOverrides,
  repoSlug,
  saveProjectOverride,
  type ProjectOverride,
} from "@/lib/projectOverrides";

export const runtime = "nodejs";

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const [projects, overrides] = await Promise.all([getAllProjects(), readProjectOverrides()]);
  return NextResponse.json({
    projects: projects.map((p) => {
      const slug = repoSlug(p.repo);
      return {
        slug,
        name: p.name,
        blurb: p.blurb,
        featured: !!p.featured,
        categories: p.categories,
        domains: p.domains ?? [],
        tags: p.tags ?? [],
        repo: p.repo,
        overridden: Object.keys(overrides[slug] ?? {}),
      };
    }),
  });
}

const strArr = (v: unknown) =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean)
    : undefined;

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { slug?: string } & Record<string, unknown>;
    const slug = (body.slug ?? "").trim().toLowerCase();
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
    const o: ProjectOverride = {
      name: typeof body.name === "string" ? body.name : undefined,
      blurb: typeof body.blurb === "string" ? body.blurb : undefined,
      featured: typeof body.featured === "boolean" ? body.featured : undefined,
      categories: strArr(body.categories) as ProjectOverride["categories"],
      domains: strArr(body.domains) as ProjectOverride["domains"],
      tags: strArr(body.tags),
    };
    await saveProjectOverride(slug, o);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}

// reset one project to fully automatic
export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const { slug } = (await request.json()) as { slug?: string };
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
    await clearProjectOverride(slug.toLowerCase());
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
