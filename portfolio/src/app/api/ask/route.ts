import { NextResponse } from "next/server";
import { answerQuestion, answerStream } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let question = "";
  let wantStream = true;
  try {
    const body = (await request.json()) as { question?: string; stream?: boolean };
    question = (body.question ?? "").trim();
    if (body.stream === false) wantStream = false;
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  if (question.length < 2) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }
  if (question.length > 500) question = question.slice(0, 500);
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "ask-unconfigured" }, { status: 503 });
  }

  // Non-streaming JSON mode (used by the eval harness).
  if (!wantStream) {
    try {
      return NextResponse.json(await answerQuestion(question));
    } catch (err) {
      console.error("ask failed", err);
      return NextResponse.json({ error: "ask-failed" }, { status: 500 });
    }
  }

  // Streaming mode: newline-delimited JSON events.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const ev of answerStream(question)) {
          controller.enqueue(encoder.encode(JSON.stringify(ev) + "\n"));
        }
      } catch (err) {
        console.error("ask stream failed", err);
        controller.enqueue(encoder.encode(JSON.stringify({ type: "error" }) + "\n"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
