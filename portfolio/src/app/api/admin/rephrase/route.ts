import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const maxDuration = 30;

// Her private writing assistant: rephrase a selected passage with whichever
// LLM providers have keys configured (OpenAI / Anthropic / Gemini), each
// returning a couple of alternatives. Key-gated; never reachable by visitors.

const TONES: Record<string, string> = {
  improve: "clearer and better written, same voice",
  tighter: "tighter and more concise, trim filler",
  formal: "more formal and professional",
  whimsical: "softer and more whimsical, a little playful",
};

const SYSTEM =
  "You rewrite short passages from a personal portfolio site (resume bullets, blog passages, poems). " +
  'Keep the meaning and roughly similar length. Reply with ONLY JSON: {"alternatives": ["...", "..."]} — exactly 2 alternatives, no commentary.';

function parseAlternatives(raw: string): string[] {
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    const j = JSON.parse(m ? m[0] : raw) as { alternatives?: unknown };
    if (Array.isArray(j.alternatives)) {
      return j.alternatives.filter((a): a is string => typeof a === "string" && !!a.trim()).slice(0, 2);
    }
  } catch {
    // fall through
  }
  return [];
}

type Suggestion = { provider: string; text: string };

async function askOpenAI(prompt: string): Promise<Suggestion[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return [];
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return [];
  const d = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return parseAlternatives(d.choices?.[0]?.message?.content ?? "").map((text) => ({ provider: "openai", text }));
}

async function askAnthropic(prompt: string): Promise<Suggestion[]> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return [];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      temperature: 0.7,
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) return [];
  const d = (await res.json()) as { content?: { type: string; text?: string }[] };
  const raw = d.content?.find((c) => c.type === "text")?.text ?? "";
  return parseAlternatives(raw).map((text) => ({ provider: "claude", text }));
}

async function askGemini(prompt: string): Promise<Suggestion[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return [];
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!res.ok) return [];
  const d = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const raw = d.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  return parseAlternatives(raw).map((text) => ({ provider: "gemini", text }));
}

export async function POST(request: Request) {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  try {
    const { text, tone, latex } = (await request.json()) as {
      text?: string;
      tone?: string;
      latex?: boolean;
    };
    const passage = (text ?? "").trim();
    if (!passage) return NextResponse.json({ error: "text is required" }, { status: 400 });
    if (passage.length > 2000) return NextResponse.json({ error: "select something shorter" }, { status: 400 });

    const style = TONES[tone ?? "improve"] ?? TONES.improve;
    const latexHint = latex
      ? " The passage is LaTeX source: preserve all LaTeX escapes and commands exactly (\\%, \\&, \\$, \\textbf{...}, $\\times$, etc.), and escape any %, &, $ you introduce."
      : "";
    const prompt = `Rewrite this passage to be ${style}.${latexHint}\n\n${passage}`;

    const results = await Promise.allSettled([askOpenAI(prompt), askAnthropic(prompt), askGemini(prompt)]);
    const suggestions = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    const providers = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY"].filter(
      (k) => !!process.env[k],
    ).length;
    if (providers === 0) {
      return NextResponse.json({ error: "no provider keys configured on this deploy" }, { status: 503 });
    }
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
