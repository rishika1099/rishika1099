"use client";

// In-place editor for the recruiter page: every line it says, and the four
// skill lists, which are copy rather than constants precisely so they can be
// edited here rather than in the source.

import PageShell from "@/components/PageShell";
import { AdminGate } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";

const ROLES = [
  { id: "data-scientist", label: "Data Scientist" },
  { id: "ml-engineer", label: "Machine Learning Engineer" },
  { id: "ai-engineer", label: "AI Engineer" },
  { id: "software-engineer", label: "Software Engineer" },
];

const HEADINGS = [
  { id: "recruiter.heading.projects", label: "projects" },
  { id: "recruiter.heading.research", label: "research" },
  { id: "recruiter.heading.experience", label: "experience" },
  { id: "recruiter.heading.education", label: "education" },
  { id: "recruiter.heading.skills", label: "skills" },
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
