import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { readClusters } from "@/lib/photos";
import { saveRegrouped, type Regrouped } from "@/lib/photoGroups";

export const runtime = "nodejs";
export const maxDuration = 60;

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

// Which photos the current groups were made from, so the regroup job can tell
// in one request whether there is anything for it to do.
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const c = await readClusters();
  return NextResponse.json({
    files: c ? Object.keys(c.assignments) : [],
    labels: c?.labels ?? {},
    k: c?.k ?? 0,
  });
}

// A fresh grouping from the regroup job. The site names the groups and saves it.
export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as Partial<Regrouped>;
    const { k, silhouette, assignments } = body;
    if (
      !Number.isInteger(k) ||
      (k as number) < 2 ||
      (k as number) > 30 ||
      typeof silhouette !== "number" ||
      !assignments ||
      typeof assignments !== "object" ||
      Object.keys(assignments).length < 4
    ) {
      return NextResponse.json({ error: "a grouping needs k, silhouette and assignments" }, { status: 400 });
    }
    const saved = await saveRegrouped(body as Regrouped);
    return NextResponse.json({ ok: true, ...saved });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
