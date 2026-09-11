import { NextResponse } from "next/server";
import { isRole } from "@/lib/recruiter";
import { resumeForRole } from "@/lib/resumePicks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The resume lines chosen for one role.
 *
 * The page asks for these under a deadline and gives up on a slow first
 * choice; this waits, so the warm script can have every role chosen before a
 * recruiter arrives. Public, and it only returns lines from the public resume.
 * The roles are a fixed set and a choice is kept until the resume changes, so
 * the model runs once per role per resume edit, however often this is called.
 */
export async function GET(request: Request) {
  const role = new URL(request.url).searchParams.get("role");
  if (!isRole(role)) return NextResponse.json({ error: "unknown role" }, { status: 400 });
  return NextResponse.json({ role, entries: await resumeForRole(role) });
}
