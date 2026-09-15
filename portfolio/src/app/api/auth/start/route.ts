import { NextResponse } from "next/server";
import { adminConfigured, authMode, scopesForKey } from "@/lib/adminAuth";
import { createChallenge } from "@/lib/ownerLogin";
import { allow, allowVisitor } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/mail";
import { geoFromHeaders } from "@/lib/analytics";

export const runtime = "nodejs";

const FALLBACK_TO_HER = "rm4318@columbia.edu";

// r•••@columbia.edu: enough for her to know which inbox to open, not enough to
// hand anyone her address
const mask = (email: string) => {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 1)}•••@${domain}`;
};

/**
 * Step one of the owner login: check the key, then email a one-time code.
 *
 * Every attempt counts against a small allowance before the key is checked, so
 * guessing is slow whether the guesses are right or wrong. A wrong key gets the
 * same answer whichever key it was near.
 */
export async function POST(request: Request) {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  let key = "";
  try {
    const body = (await request.json()) as { key?: unknown };
    key = typeof body.key === "string" ? body.key.trim() : "";
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }

  if (!(await allowVisitor(request, "login", 5, 40, 15 * 60))) {
    return NextResponse.json({ error: "slow-down" }, { status: 429 });
  }
  const scopes = scopesForKey(key);
  if (!scopes.length) return NextResponse.json({ error: "wrong-key" }, { status: 401 });

  // on her own machine the key is the whole login, as before
  if (authMode() === "local") return NextResponse.json({ mode: "local", scopes });

  // a right key can still be abused to fill her inbox, so codes are capped too
  if (!(await allow("login-codes", "everyone", 12, 3600))) {
    return NextResponse.json({ error: "slow-down" }, { status: 429 });
  }

  const to = process.env.ADMIN_EMAIL || FALLBACK_TO_HER;
  const { id, code, minutes } = await createChallenge(scopes);
  const room = scopes.includes("admin") ? "the atelier" : "the stats room";
  const { city, country } = geoFromHeaders(request.headers);
  const where = city || country || "somewhere unknown";
  const when = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const sent = await sendEmail(
    {
      from: "rishika-m.com <login@rishika-m.com>",
      to: [to],
      subject: `${code} is your sign-in code`,
      html: `<div style="font-family:-apple-system,Helvetica,Arial,sans-serif;color:#2b2540;max-width:520px">
        <p style="margin:0 0 14px">Someone typed the right key for ${room} on rishika-m.com.</p>
        <p style="margin:0 0 6px;font-size:13px;color:#6b6480">your code</p>
        <p style="margin:0 0 16px;font-size:32px;font-weight:700;letter-spacing:6px">${code}</p>
        <p style="margin:0 0 14px">It works once, for ${minutes} minutes.</p>
        <p style="margin:0 0 4px;font-size:13px;color:#6b6480">from: ${where} · ${when} (New York)</p>
        <p style="margin:16px 0 0;font-size:13px;color:#6b6480">If this was not you, someone has your key. Change ADMIN_KEY (or STATS_KEY) in Netlify's environment variables and redeploy; that also signs out every open session.</p>
      </div>`,
      text: `Someone typed the right key for ${room} on rishika-m.com.\n\nYour code: ${code}\nIt works once, for ${minutes} minutes.\n\nfrom: ${where} · ${when} (New York)\n\nIf this was not you, someone has your key. Change ADMIN_KEY (or STATS_KEY) in Netlify's environment variables and redeploy; that also signs out every open session.`,
    },
    "owner-login",
  );
  if (!sent) return NextResponse.json({ error: "not-sent" }, { status: 502 });
  return NextResponse.json({ mode: "live", challenge: id, sentTo: mask(to), minutes });
}
