import { NextResponse } from "next/server";
import { getAllProjects } from "@/lib/github-projects";
import { ROLES, projectsForRole } from "@/lib/recruiter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Which projects can appear under each role.
 *
 * Exists so the warm script does not have to reimplement the ranking, and so it
 * cannot drift from it: the page and the warmer ask the same function which
 * projects matter. Public, and it only names projects that are already public.
 */
export async function GET() {
  const projects = await getAllProjects();
  const byRole = Object.fromEntries(
    ROLES.map((r) => [r, projectsForRole(projects, r).map((p) => p.repo)]),
  );
  return NextResponse.json({ byRole });
}
