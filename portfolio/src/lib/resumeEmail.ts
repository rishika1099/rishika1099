// The resume, sent to a recruiter's inbox.
//
// A recruiter who asks for it gets an email from resume@rishika-m.com with the
// PDF attached and, above it, the lines of the resume that answer what they are
// hiring for: the lines a role tile picks, or the ones a pasted posting picks.
// Same selection the page already makes, so the email and the page can never
// disagree, and nothing in it is written by a model. Replies go to her.
//
// She gets a short note of every request, with the posting if there was one, so
// she can follow up. The form says so.
//
// Anyone can type any address into a form, so this is also a way to send her
// name to a stranger's inbox. Three things keep that small: a hidden field and a
// minimum time on the form turn away scripts, and daily caps per visitor, per
// recipient and overall keep a person from doing it at any volume. The overall
// cap also keeps two emails a request inside Resend's free 100 a day.

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { blobsEnabled } from "@/lib/blobs";
import { readFileKind } from "@/lib/files";
import { getResumeTex } from "@/lib/resumeSource";
import { parseResumeTex } from "@/lib/resumeTex";
import { flattenResume, tailorTo, MAX_JD, type TailoredEntry } from "@/lib/tailor";
import { resumeForRole } from "@/lib/resumePicks";
import { ROLE_SPECS, plain, type Role } from "@/lib/recruiter";
import { getCopy } from "@/lib/siteCopy";
import { getContactLinks } from "@/lib/contactLinks";
import { SITE_URL } from "@/lib/siteUrl";

export const FROM = "Rishika Mamidibathula <resume@rishika-m.com>";
const FALLBACK_TO_HER = "rm4318@columbia.edu";

const PER_VISITOR = 5;
const PER_RECIPIENT = 3;
const PER_DAY = 40;

// A posting is read by the model before the email goes. Past this it is sent
// with the role's lines instead (or none), rather than timing the request out.
const POSTING_MS = 12000;

export const EMAIL_RE = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[a-z]{2,}$/i;

// ---------------------------------------------------------------- limits

interface Counts {
  day: string;
  visitors: Record<string, number>;
  recipients: Record<string, number>;
  total: number;
}

const LIMITS_KEY = "limits";
const LOCAL_LIMITS = path.join(process.cwd(), "src/content/resume-email-limits.json");

const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());

// Neither the address nor the IP is kept, only a salted fingerprint of each,
// and only for the day.
const fingerprint = (v: string) =>
  createHash("sha256")
    .update(`${process.env.RESEND_API_KEY ?? "local"}|${v.toLowerCase()}`)
    .digest("hex")
    .slice(0, 16);

// Read-your-writes for the counters. The default store reads can trail a write
// by up to a minute, which is long enough to send a burst straight past a cap.
async function limitsStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore({ name: "resume-email", consistency: "strong" });
}

async function readCounts(): Promise<Counts> {
  const fresh: Counts = { day: today(), visitors: {}, recipients: {}, total: 0 };
  try {
    let raw: string | null = null;
    if (blobsEnabled()) {
      raw = ((await (await limitsStore()).get(LIMITS_KEY, { type: "text" })) as string | null) ?? null;
    } else if (fs.existsSync(LOCAL_LIMITS)) {
      raw = fs.readFileSync(LOCAL_LIMITS, "utf8");
    }
    const c = raw ? (JSON.parse(raw) as Counts) : null;
    // yesterday's counts are simply replaced, which is also the cleanup
    return c && c.day === fresh.day ? c : fresh;
  } catch {
    return fresh;
  }
}

async function writeCounts(c: Counts) {
  if (blobsEnabled()) {
    await (await limitsStore()).setJSON(LIMITS_KEY, c);
  } else {
    fs.writeFileSync(LOCAL_LIMITS, JSON.stringify(c, null, 2));
  }
}

/**
 * Count this request against the day's caps, or say which cap it hits.
 * Counted before sending, so a run of failures cannot be retried endlessly.
 */
export async function takeSlot(visitor: string, recipient: string): Promise<"ok" | "limit"> {
  const c = await readCounts();
  const v = fingerprint(visitor);
  const r = fingerprint(recipient);
  if (
    c.total >= PER_DAY ||
    (c.visitors[v] ?? 0) >= PER_VISITOR ||
    (c.recipients[r] ?? 0) >= PER_RECIPIENT
  ) {
    return "limit";
  }
  c.total += 1;
  c.visitors[v] = (c.visitors[v] ?? 0) + 1;
  c.recipients[r] = (c.recipients[r] ?? 0) + 1;
  await writeCounts(c);
  return "ok";
}

// ---------------------------------------------------------------- content

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function withDeadline<T>(work: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    work.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/** The lines to lead with: the posting's if it was read in time, else the role's. */
async function choosePicks(role: Role | null, posting: string): Promise<{
  picks: TailoredEntry[];
  basis: "posting" | "role" | "none";
}> {
  if (posting) {
    const t = await withDeadline(tailorTo(posting.slice(0, MAX_JD)), POSTING_MS);
    if (t?.entries.length) return { picks: t.entries, basis: "posting" };
  }
  if (role) {
    const r = await withDeadline(resumeForRole(role), POSTING_MS);
    if (r?.length) return { picks: r, basis: "role" };
  }
  // Nothing asked, or nothing chosen in time: lead with her most recent work,
  // the way the resume itself does.
  const { flat } = flattenResume(parseResumeTex(await getResumeTex()));
  const work = flat.filter((e) => /experience/i.test(e.section)).slice(0, 2);
  return {
    picks: work.map((e) => ({ ...e, bullets: e.bullets.slice(0, 2) })),
    basis: "none",
  };
}

async function resumePdf(): Promise<{ filename: string; content: string } | null> {
  const filename = "Rishika_Mamidibathula_Resume.pdf";
  try {
    const f = await readFileKind("resume");
    if (f) return { filename, content: f.buf.toString("base64") };
    const res = await fetch(new URL("/Rishika_Resume.pdf", SITE_URL));
    if (res.ok) return { filename, content: Buffer.from(await res.arrayBuffer()).toString("base64") };
  } catch {
    // sent without it: the email still links to the resume
  }
  return null;
}

async function herAddress(): Promise<string> {
  const links = await getContactLinks();
  const mail = links.find((l) => l.href.startsWith("mailto:"));
  const addr = mail?.href.replace(/^mailto:/, "").split("?")[0].trim();
  return addr && EMAIL_RE.test(addr) ? addr : FALLBACK_TO_HER;
}

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:4px 8px 4px 0;padding:10px 18px;border-radius:999px;background:#c2c0ef;color:#2b2540;font-weight:600;text-decoration:none">${esc(label)}</a>`;

function recruiterHtml(o: {
  intro: string;
  heading: string;
  picks: TailoredEntry[];
  pageHref: string;
  pageLabel: string;
  printLabel: string;
  signoff: string;
  footer: string;
  attached: boolean;
  attachedLine: string;
}): string {
  const entries = o.picks
    .map(
      (e) => `
      <div style="margin:0 0 18px">
        <div style="font-weight:700;color:#2b2540">${esc(e.title)}</div>
        ${e.meta ? `<div style="font-size:13px;color:#6b6480;margin-top:2px">${esc(e.meta)}</div>` : ""}
        <ul style="margin:8px 0 0;padding-left:18px;color:#3d3752">
          ${e.bullets.map((b) => `<li style="margin:0 0 6px;line-height:1.5">${esc(b)}</li>`).join("")}
        </ul>
      </div>`,
    )
    .join("");
  const para = (s: string) =>
    s
      .split(/\n{2,}/)
      .map((p) => `<p style="margin:0 0 14px;line-height:1.6">${esc(p).replace(/\n/g, "<br>")}</p>`)
      .join("");
  return `<!doctype html><html><body style="margin:0;background:#f3f1fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#3d3752">
  <div style="max-width:580px;margin:0 auto;padding:28px 16px">
    <div style="background:#ffffff;border-radius:24px;padding:28px 26px">
      <div style="font-size:20px;font-weight:700;color:#2b2540">Rishika Mamidibathula</div>
      <div style="font-size:13px;color:#6b6480;margin:2px 0 20px">${esc(SITE_URL.replace(/^https?:\/\//, ""))}</div>
      ${para(o.intro)}
      ${o.attached ? `<p style="margin:0 0 20px;line-height:1.6">${esc(o.attachedLine)}</p>` : ""}
      ${
        o.picks.length
          ? `<div style="font-size:15px;font-weight:700;color:#2b2540;margin:8px 0 12px">${esc(o.heading)}</div>${entries}`
          : ""
      }
      <div style="margin:18px 0 22px">
        ${button(o.pageHref, o.pageLabel)}
        ${button(`${SITE_URL}/resume/print`, o.printLabel)}
      </div>
      ${para(o.signoff)}
    </div>
    <p style="font-size:12px;color:#8a839c;line-height:1.5;margin:14px 8px 0">${esc(o.footer)}</p>
  </div>
</body></html>`;
}

function recruiterText(o: {
  intro: string;
  attached: boolean;
  attachedLine: string;
  heading: string;
  picks: TailoredEntry[];
  pageHref: string;
  signoff: string;
  footer: string;
}): string {
  const entries = o.picks
    .map((e) => [e.title, e.meta, ...e.bullets.map((b) => `  - ${b}`)].filter(Boolean).join("\n"))
    .join("\n\n");
  return [
    o.intro,
    o.attached ? o.attachedLine : "",
    o.picks.length ? `${o.heading}\n\n${entries}` : "",
    `${o.pageHref}\n${SITE_URL}/resume/print`,
    o.signoff,
    `--\n${o.footer}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

// ---------------------------------------------------------------- sending

async function send(body: Record<string, unknown>): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // on the live site a missing key is a failure, never a quiet "sent"
    if (blobsEnabled()) return false;
    // local dev has no key: show what would have gone, and carry on
    console.log(
      "[resume-email] no RESEND_API_KEY, not sent:",
      JSON.stringify({ ...body, html: "(html)", attachments: body.attachments ? "(pdf)" : undefined }, null, 2),
    );
    return true;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error("[resume-email] resend refused", res.status, await res.text().catch(() => ""));
  return res.ok;
}

export async function sendResume(req: {
  to: string;
  role: Role | null;
  posting: string;
}): Promise<boolean> {
  const [copy, { picks, basis }, pdf, her] = await Promise.all([
    getCopy(),
    choosePicks(req.role, req.posting),
    resumePdf(),
    herAddress(),
  ]);
  const t = (k: string) => plain(copy[k], 2000);
  const spec = req.role ? ROLE_SPECS[req.role] : null;

  const subject = spec ? `${t("recruiter.email.subject")} (${spec.label})` : t("recruiter.email.subject");
  const heading =
    basis === "posting"
      ? `${t("recruiter.email.highlights")}, for your posting`
      : basis === "role" && spec
        ? `${t("recruiter.email.highlights")}, for ${spec.article}`
        : t("recruiter.email.highlights");
  const pageHref = req.role ? `${SITE_URL}/recruiter?role=${req.role}` : `${SITE_URL}/recruiter`;
  const parts = {
    intro: t("recruiter.email.intro"),
    heading,
    picks,
    pageHref,
    pageLabel: t("recruiter.email.pagebutton"),
    printLabel: t("recruiter.email.printbutton"),
    signoff: t("recruiter.email.signoff"),
    footer: t("recruiter.email.footer"),
    attached: !!pdf,
    attachedLine: t("recruiter.email.attached"),
  };

  const sent = await send({
    from: FROM,
    to: [req.to],
    reply_to: her,
    subject,
    html: recruiterHtml(parts),
    text: recruiterText(parts),
    ...(pdf ? { attachments: [pdf] } : {}),
  });
  if (!sent) return false;

  // Her copy. A failure here is logged and nothing more: the recruiter already
  // has what they asked for.
  const when = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
  const rows: [string, string][] = [
    ["sent to", req.to],
    ["role", spec?.label ?? "none picked"],
    ["led with", basis === "posting" ? "lines chosen for their posting" : basis === "role" ? "the role's lines" : "her latest work"],
    ["when", `${when} (New York)`],
  ];
  const noteHtml = `<div style="font-family:-apple-system,Helvetica,Arial,sans-serif;color:#2b2540;max-width:620px">
    <p style="margin:0 0 12px">Someone asked for your résumé at ${esc(SITE_URL.replace(/^https?:\/\//, ""))}. Reply to this email to write back to them.</p>
    <table style="border-collapse:collapse;font-size:14px">${rows
      .map(([k, v]) => `<tr><td style="padding:3px 14px 3px 0;color:#6b6480">${esc(k)}</td><td style="padding:3px 0">${esc(v)}</td></tr>`)
      .join("")}</table>
    ${picks.length ? `<p style="margin:14px 0 4px;color:#6b6480">lines it led with</p><ul style="margin:0;padding-left:18px">${picks.map((p) => `<li>${esc(p.title)}</li>`).join("")}</ul>` : ""}
    ${req.posting ? `<p style="margin:14px 0 4px;color:#6b6480">their posting</p><div style="white-space:pre-wrap;font-size:13px;background:#f3f1fb;border-radius:12px;padding:12px">${esc(req.posting.slice(0, MAX_JD))}</div>` : ""}
  </div>`;
  const noteText = [
    "Someone asked for your résumé. Reply to this email to write back to them.",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    picks.length ? `lines it led with: ${picks.map((p) => p.title).join("; ")}` : "",
    req.posting ? `their posting:\n${req.posting.slice(0, MAX_JD)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const noted = await send({
    from: FROM,
    to: [her],
    reply_to: req.to,
    subject: `résumé sent to ${req.to}${spec ? ` (${spec.label})` : ""}`,
    html: noteHtml,
    text: noteText,
  }).catch(() => false);
  if (!noted) console.error("[resume-email] her copy did not send");
  return true;
}
