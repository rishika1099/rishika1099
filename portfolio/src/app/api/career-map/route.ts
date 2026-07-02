import { NextResponse } from "next/server";
import { careerMap } from "@/lib/careerMap";

export const runtime = "nodejs";

export async function GET() {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  }
  try {
    return NextResponse.json({ points: await careerMap() });
  } catch (err) {
    console.error("career map failed", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
