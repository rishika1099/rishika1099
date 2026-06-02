import { NextResponse } from "next/server";
import { projectMap } from "@/lib/search";

export const runtime = "nodejs";

export async function GET() {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "map-unconfigured" }, { status: 503 });
  }
  try {
    const points = await projectMap();
    return NextResponse.json({ points });
  } catch (err) {
    console.error("project map failed", err);
    return NextResponse.json({ error: "map-failed" }, { status: 500 });
  }
}
