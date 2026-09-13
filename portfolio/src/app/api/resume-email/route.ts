import { NextResponse } from "next/server";
import { EMAIL_RE, sendResume, takeSlot } from "@/lib/resumeEmail";
import { MAX_JD } from "@/lib/tailor";
import { isRole } from "@/lib/recruiter";

export const runtime = "nodejs";
export const maxDuration = 30;

const BOT_RE = /bot|crawl|spider|preview|headless|lighthouse|monitor/i;
// a person takes longer than this to type an address; a script does not
const MIN_FORM_MS = 1500;

/**
 * Email the resume to the address given.
 *
 * POST, for the same reason the posting box is: a job description does not
 * belong in a URL. A request turned away as a bot is answered as though it
 * worked, so a script learns nothing from trying.
 */
export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY && process.env.NETLIFY) {
    return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  }
  try {
    const body = (await request.json()) as {
      email?: unknown;
      role?: unknown;
      jd?: unknown;
      website?: unknown;
      elapsed?: unknown;
    };
    if (
      BOT_RE.test(request.headers.get("user-agent") ?? "") ||
      body.website ||
      (typeof body.elapsed === "number" && body.elapsed < MIN_FORM_MS)
    ) {
      return NextResponse.json({ ok: true });
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "email" }, { status: 400 });
    }
    const role = isRole(body.role) ? body.role : null;
    const posting = typeof body.jd === "string" ? body.jd.trim().slice(0, MAX_JD) : "";

    const visitor =
      request.headers.get("x-nf-client-connection-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "unknown";
    if ((await takeSlot(visitor, email)) === "limit") {
      return NextResponse.json({ error: "limit" }, { status: 429 });
    }

    const ok = await sendResume({ to: email, role, posting });
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "failed" }, { status: 502 });
  } catch (err) {
    console.error("resume-email failed", err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
