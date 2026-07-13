import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const maxDuration = 60;

// Her private resume reviewer: sends the resume source to an LLM acting as a
// sharp recruiter/hiring-manager and returns structured feedback (verdict,
// score, strengths, weak points with concrete fixes, quick wins). Key-gated.

export interface ResumeAnalysis {
  verdict: string;
  score: number; // 0-100
  strengths: string[];
  weaknesses: { issue: string; where: string; fix: string }[];
  quickWins: string[];
}

const SYSTEM = `You are a sharp, honest resume reviewer who has screened thousands of data science / ML resumes at top tech companies. You are reviewing the LaTeX source of a resume; judge the CONTENT (impact, specificity, metrics, clarity, redundancy, ordering), not the LaTeX code itself.

Reply with ONLY JSON in exactly this shape:
{
  "verdict": "one blunt but kind sentence summarizing the resume",
  "score": 0-100,
  "strengths": ["2 to 4 short bullets on what genuinely works"],
  "weaknesses": [{"issue": "what's weak", "where": "the section or a short quote", "fix": "a concrete rewrite or action"} — 3 to 6 of these, most important first],
  "quickWins": ["2 to 4 small changes with outsized payoff"]
}
Be specific: quote the resume's own phrases in "where", and make every "fix" actionable (an actual rewritten line where possible). No generic advice.`;

export async function POST(request: Request) {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "no provider key configured" }, { status: 503 });
  try {
    const { tex, role } = (await request.json()) as { tex?: string; role?: string };
    if (!tex?.trim()) return NextResponse.json({ error: "tex is required" }, { status: 400 });
    if (tex.length > 60_000) return NextResponse.json({ error: "resume too large" }, { status: 400 });

    const target = (role ?? "").trim().slice(0, 120) || "Data Scientist / ML Engineer roles";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Target: ${target}\n\nResume (LaTeX source):\n\n${tex}` },
        ],
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) return NextResponse.json({ error: "the reviewer didn't answer, try again?" }, { status: 502 });
    const d = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = d.choices?.[0]?.message?.content ?? "";
    const j = JSON.parse(raw) as Partial<ResumeAnalysis> & { quick_wins?: string[] };
    const analysis: ResumeAnalysis = {
      verdict: typeof j.verdict === "string" ? j.verdict : "analysis came back empty, try again?",
      score: Math.max(0, Math.min(100, Number(j.score) || 0)),
      strengths: Array.isArray(j.strengths) ? j.strengths.filter((s) => typeof s === "string").slice(0, 4) : [],
      weaknesses: Array.isArray(j.weaknesses)
        ? j.weaknesses
            .filter((w) => w && typeof w === "object")
            .map((w) => ({
              issue: String((w as Record<string, unknown>).issue ?? ""),
              where: String((w as Record<string, unknown>).where ?? ""),
              fix: String((w as Record<string, unknown>).fix ?? ""),
            }))
            .filter((w) => w.issue)
            .slice(0, 6)
        : [],
      quickWins: Array.isArray(j.quickWins ?? j.quick_wins)
        ? (j.quickWins ?? j.quick_wins)!.filter((s) => typeof s === "string").slice(0, 4)
        : [],
    };
    return NextResponse.json({ analysis });
  } catch {
    return NextResponse.json({ error: "analysis failed, try again?" }, { status: 500 });
  }
}
