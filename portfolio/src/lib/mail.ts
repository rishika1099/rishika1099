// Sending email through Resend, from the verified rishika-m.com domain.
//
// One place for it, since the resume form and the owner login both send. The
// key only has sending access, and only for this domain.

import { onLiveSite } from "@/lib/rateLimit";

/**
 * Send one email; true when Resend accepted it.
 *
 * With no key on her own machine it prints what would have gone and reports
 * success, so the flows can be tried locally. With no key on the live site it
 * fails: a missing key must never look like a sent email.
 */
export async function sendEmail(body: Record<string, unknown>, tag = "mail"): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (onLiveSite()) return false;
    console.log(
      `[${tag}] no RESEND_API_KEY, not sent:`,
      JSON.stringify({ ...body, html: "(html)", attachments: body.attachments ? "(pdf)" : undefined }, null, 2),
    );
    return true;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error(`[${tag}] resend refused`, res.status, await res.text().catch(() => ""));
  return res.ok;
}
