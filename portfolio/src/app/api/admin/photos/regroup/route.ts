import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { runWorkflow } from "@/lib/githubFile";

export const runtime = "nodejs";

// "Regroup now", for after a batch of uploads. The grouping cannot run here
// (the image model is far too heavy for a function), so this starts the
// scheduled job early. Without it the job still runs on its own every hour.
export async function POST(request: Request) {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  const result = await runWorkflow("regroup-photos.yml");
  return NextResponse.json({ started: result.status === "pushed", ...result });
}
