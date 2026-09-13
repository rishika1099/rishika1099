"use client";

// In-place editor for the recruiter page: every line it says, and each role's
// skill list, which are copy rather than constants precisely so they can be
// edited here rather than in the source.

import PageShell from "@/components/PageShell";
import { AdminGate } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";
import { ROLES as ROLE_IDS, ROLE_SPECS } from "@/lib/recruiter";

// Read from the same list the page renders its pills from. This used to be its
// own hand-kept copy, so a role added to the page had no summary or skills to
// edit here until someone remembered to add it twice.
const ROLES = ROLE_IDS.map((id) => ({ id, label: ROLE_SPECS[id].label }));

// the email form, then the email it sends, in the order they are met
const EMAIL_FORM = ["open", "placeholder", "anyrole", "jd", "send", "sending", "note", "sent", "bademail", "limit", "error"];
const EMAIL_BODY = ["subject", "intro", "attached", "highlights", "pagebutton", "printbutton", "signoff", "footer"];
const EMAIL_KEYS = [...EMAIL_FORM, ...EMAIL_BODY];

const HEADINGS = [
  { id: "recruiter.heading.projects", label: "projects" },
  { id: "recruiter.heading.research", label: "research" },
  { id: "recruiter.heading.experience", label: "experience" },
  { id: "recruiter.heading.education", label: "education" },
  { id: "recruiter.heading.teaching", label: "teaching" },
  { id: "recruiter.heading.skills", label: "skills" },
  { id: "recruiter.heading.resume", label: "résumé (over the preview, and a posting's lines)" },
];

function Editor({ keyVal }: { keyVal: string }) {
  const { ready, box, bar, titleBox } = usePassageEditor(
    keyVal,
    [
      "recruiter.title",
      "recruiter.intro",
      "recruiter.ask",
      "recruiter.jd.label",
      "recruiter.jd.hint",
      "recruiter.jd.placeholder",
      "recruiter.resume.download",
      "recruiter.resume.page",
      ...EMAIL_KEYS.map((k) => `recruiter.email.${k}`),
      "home.recruiter",
      ...ROLES.flatMap((r) => [`recruiter.summary.${r.id}`, `recruiter.skills.${r.id}`]),
      ...HEADINGS.map((h) => h.id),
    ],
    "/recruiter",
  );
  if (!ready)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;

  return (
    <PageShell vibe="periwinkle">
      {bar}
      {titleBox("recruiter.title")}

      <div className="mt-3 max-w-2xl">{box("recruiter.intro", "font-body text-lg text-ink-soft")}</div>

      <section className="mt-8 rounded-3xl p-5 soft-card">
        <h2 className="font-body text-sm font-bold text-ink">the question, and the posting box</h2>
        <div className="mt-2 space-y-2">
          {box("recruiter.ask", "font-body text-sm text-ink-soft")}
          {box("recruiter.jd.label", "font-body text-sm text-ink-soft")}
          {box("recruiter.jd.hint", "font-body text-sm text-ink-soft")}
          {box("recruiter.jd.placeholder", "font-body text-sm text-ink-soft")}
          {box("recruiter.resume.download", "font-body text-sm text-ink-soft")}
          {box("recruiter.resume.page", "font-body text-sm text-ink-soft")}
        </div>
      </section>

      <section className="mt-6 rounded-3xl p-5 soft-card">
        <h2 className="font-body text-sm font-bold text-ink">the résumé by email: the form</h2>
        <div className="mt-2 space-y-2">
          {EMAIL_FORM.map((k) => (
            <div key={k}>{box(`recruiter.email.${k}`, "font-body text-sm text-ink-soft")}</div>
          ))}
        </div>
        <h2 className="mt-5 font-body text-sm font-bold text-ink">the email it sends</h2>
        <p className="mt-1 font-body text-[11px] text-ink-soft/70">
          the subject and the heading over the chosen lines get the role added after them
        </p>
        <div className="mt-2 space-y-2">
          {EMAIL_BODY.map((k) => (
            <div key={k}>{box(`recruiter.email.${k}`, "font-body text-sm text-ink-soft")}</div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl p-5 soft-card">
        <h2 className="font-body text-sm font-bold text-ink">the line on the home page</h2>
        <div className="mt-2">{box("home.recruiter", "font-body text-sm text-ink-soft")}</div>
      </section>

      {ROLES.map((r) => (
        <section key={r.id} className="mt-6 rounded-3xl p-5 soft-card">
          <h2 className="font-body text-sm font-bold text-ink">{r.label}</h2>
          <p className="mt-2 font-body text-[11px] font-semibold text-ink-soft">
            the summary at the top of the page
          </p>
          {box(`recruiter.summary.${r.id}`, "font-body text-sm text-ink-soft")}
          <p className="mt-3 font-body text-[11px] font-semibold text-ink-soft">
            skills, one per line or comma separated. Each becomes its own bubble.
          </p>
          {box(`recruiter.skills.${r.id}`, "font-body text-sm text-ink-soft")}
        </section>
      ))}

      <section className="mt-6 rounded-3xl p-5 soft-card">
        <h2 className="font-body text-sm font-bold text-ink">section headings</h2>
        <div className="mt-2 space-y-2">
          {HEADINGS.map((h) => (
            <div key={h.id}>
              <p className="font-body text-[11px] font-semibold text-ink-soft">{h.label}</p>
              {box(h.id, "font-body text-base font-bold text-ink")}
            </div>
          ))}
        </div>
      </section>

      <p className="mt-8 font-body text-xs text-ink-soft/70">
        the projects, research, experience and education on that page come from the Work and About
        entries, so they are edited in their own rooms ✦
      </p>
    </PageShell>
  );
}

export default function RecruiterEditPage() {
  return <AdminGate>{(keyVal) => <Editor keyVal={keyVal} />}</AdminGate>;
}
