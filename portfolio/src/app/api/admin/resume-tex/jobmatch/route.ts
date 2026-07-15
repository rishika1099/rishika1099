import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const maxDuration = 60;

// The application machine: paste a job description next to the resume and get
// either a gap report (mode "match") or a tailored cover letter draft (mode
// "cover"). Key-gated, owner-only, like the rest of the studio.

export interface JobMatch {
  fit: number; // 0-100
  verdict: string;
  hits: { requirement: string; evidence: string }[];
  gaps: { requirement: string; severity: "high" | "medium" | "low"; suggestion: string }[];
  keywordsMissing: string[];
  emphasize: string[];
  tweaks: { current: string; suggested: string }[];
}

const MATCH_SYSTEM = `You are a ruthless but constructive recruiter screening a resume against a specific job description, for data science / ML roles. Judge only what the resume actually says; never invent experience.

Reply with ONLY JSON in exactly this shape:
{
  "fit": 0-100,
  "verdict": "one honest sentence: how strong is this application",
  "hits": [{"requirement": "a JD requirement", "evidence": "the resume line that satisfies it"} — the strongest 3-6 matches],
  "gaps": [{"requirement": "a JD requirement the resume misses or undersells", "severity": "high|medium|low", "suggestion": "concrete action: reword X, add Y metric, or honestly note it's absent"} — 2-5],
  "keywordsMissing": ["exact ATS keywords/phrases from the JD absent from the resume, only ones she could truthfully add" — up to 8],
  "emphasize": ["which existing bullets/projects to lead with for THIS role" — 2-4],
  "tweaks": [{"current": "an existing resume line", "suggested": "the line reworded to speak this JD's language, truthfully"} — 2-4]
}`;

const COVER_SYSTEM = `You draft short, specific cover letters for data science / ML roles. Ground every claim in the resume; never invent experience. Voice: warm, direct, confident, zero clichés ("I am writing to express..." is banned). Structure: a hook tying her strongest relevant work to the company's problem, one paragraph of evidence (2-3 concrete wins with metrics from the resume), one paragraph on why this team/company specifically (from the JD), and a short close. 220-300 words. Address it "Dear Hiring Team" unless the JD names someone.

Reply with ONLY JSON: {"letter": "the letter, with \\n\\n between paragraphs"}`;

export async function POST(request: Request) {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ error: "no provider key configured" }, { status: 503 });
  try {
    const { tex, jd, mode } = (await request.json()) as { tex?: string; jd?: string; mode?: string };
    if (!tex?.trim() || !jd?.trim()) {
      return NextResponse.json({ error: "resume and job description are required" }, { status: 400 });
    }
    if (jd.length > 30_000 || tex.length > 60_000) {
      return NextResponse.json({ error: "that's too long" }, { status: 400 });
    }
    const cover = mode === "cover";

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: cover ? 0.7 : 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: cover ? COVER_SYSTEM : MATCH_SYSTEM },
          {
            role: "user",
            content: `JOB DESCRIPTION:\n${jd}\n\nRESUME (LaTeX source, judge the content):\n${tex}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(50000),
    });
    if (!res.ok) return NextResponse.json({ error: "the reviewer didn't answer, try again?" }, { status: 502 });
    const d = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = d.choices?.[0]?.message?.content ?? "{}";

    if (cover) {
      const j = JSON.parse(raw) as { letter?: string };
      if (!j.letter) return NextResponse.json({ error: "no letter came back, try again?" }, { status: 502 });
      return NextResponse.json({ letter: j.letter });
    }

    const j = JSON.parse(raw) as Partial<JobMatch> & { keywords_missing?: string[] };
    const arr = <T,>(v: unknown, n: number): T[] => (Array.isArray(v) ? (v as T[]).slice(0, n) : []);
    const match: JobMatch = {
      fit: Math.max(0, Math.min(100, Number(j.fit) || 0)),
      verdict: typeof j.verdict === "string" ? j.verdict : "",
      hits: arr<JobMatch["hits"][number]>(j.hits, 6).filter((h) => h?.requirement),
      gaps: arr<JobMatch["gaps"][number]>(j.gaps, 5).filter((g) => g?.requirement),
      keywordsMissing: arr<string>(j.keywordsMissing ?? j.keywords_missing, 8).filter((s) => typeof s === "string"),
      emphasize: arr<string>(j.emphasize, 4).filter((s) => typeof s === "string"),
      tweaks: arr<JobMatch["tweaks"][number]>(j.tweaks, 4).filter((t) => t?.suggested),
    };
    return NextResponse.json({ match });
  } catch {
    return NextResponse.json({ error: "analysis failed, try again?" }, { status: 500 });
  }
}
