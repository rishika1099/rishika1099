import { NextResponse } from "next/server";
import { answerQuestion } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  let question = "";
  try {
    const body = (await request.json()) as { question?: string };
    question = (body.question ?? "").trim();
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  if (question.length < 2) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }
  if (question.length > 500) {
    question = question.slice(0, 500);
  }
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "ask-unconfigured" }, { status: 503 });
  }

  try {
    const result = await answerQuestion(question);
    return NextResponse.json(result);
  } catch (err) {
    console.error("ask-my-portfolio failed", err);
    return NextResponse.json({ error: "ask-failed" }, { status: 500 });
  }
}
