"use client";

import { useState } from "react";
import RecruiterProjects from "@/components/RecruiterProjects";
import type { Project } from "@/data/projects";
import type { CaseStudy } from "@/lib/caseStudies";
import type { Pipeline } from "@/lib/pipeline";
import type { Tailored } from "@/lib/tailor";
import type { Angles } from "@/lib/angle";
import { FilledNotes } from "@/components/EntryCard";

/**
 * The role's page, with a job description able to re-aim it.
 *
 * A posting is not a different kind of answer, it is a better guess at the same
 * question the four role buttons ask. So it does not get a presentation of its
 * own: it swaps which projects and which skills the page is showing, in the
 * cards the page already uses. Work, research and education do not move,
 * because they do not change with the posting.
 */
export default function RecruiterView({
  projects,
  slugs,
  studies,
  pipelines,
  images,
  skills,
  angles,
  projectsLabel,
  projectsHint,
  skillsLabel,
  jdLabel,
  jdHint,
  jdPlaceholder,
  picker,
  children,
}: {
  projects: Project[];
  slugs: string[];
  studies: (CaseStudy | null)[];
  pipelines: (Pipeline | null)[];
  images: ({ id: string; name: string } | undefined)[];
  skills: string[];
  /** each entry's note re-angled toward the role, keyed by title */
  angles: Angles;
  projectsLabel: string;
  projectsHint: string;
  skillsLabel: string;
  jdLabel: string;
  jdHint: string;
  jdPlaceholder: string;
  /** the role picker, placed beside the posting box rather than above it */
  picker: React.ReactNode;
  /** work, research and education: constant, whatever the posting says */
  children: React.ReactNode;
}) {
  const [jd, setJd] = useState("");
  const [state, setState] = useState<"idle" | "working" | "error">("idle");
  const [match, setMatch] = useState<Tailored | null>(null);

  async function run() {
    if (!jd.trim()) return;
    setState("working");
    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd }),
      });
      if (!res.ok) throw new Error();
      const d = (await res.json()) as { tailored?: Tailored };
      setMatch(d.tailored ?? null);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  const filtering = !!match;
  // a matched project is a search hit: the card reads the same fields
  const shownProjects = (filtering ? (match!.projects as unknown as Project[]) : projects).slice(0, 6);
  const shownSlugs = filtering
    ? shownProjects.map((p) => (p.repo || "").split("/").pop()?.toLowerCase() ?? "")
    : slugs;
  const shownSkills = filtering && match!.skills.length ? match!.skills : skills;
  // A posting's angles beat the role's, and the cards read them through the
  // same context the About page uses, so nothing about the card changes: only
  // which note it is handed.
  const shownAngles = filtering && Object.keys(match!.angles).length ? match!.angles : angles;

  return (
    <>
      {/* Two ways of asking the same question, side by side rather than stacked.
          Stacked they filled the screen before a single piece of work, so a
          recruiter met a column of controls and had to scroll to reach anything
          that answered them. Paired, the whole ask fits in about the height the
          posting box alone used to take. */}
      <div className="mt-7 grid gap-x-10 gap-y-7 md:grid-cols-2">
        {picker}
        <section>
          <p className="font-body text-sm font-semibold text-ink">{jdLabel}</p>
          {/* Laid out the way the work page lays out its search: the bar, then
              one thin line under it saying what it does. The explanation used to
              sit above the field in full, two lines of it, which made the ask
              read as instructions to get through rather than a box to type in. */}
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
              🔍
            </span>
            <input
              type="search"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  run();
                }
              }}
              placeholder={jdPlaceholder}
              aria-label={jdLabel}
              // the page's own periwinkle on focus, not the site's blush: a pink
              // ring on this ground reads as borrowed from another page
              className="w-full rounded-full border border-white/70 bg-white/80 py-3 pl-11 pr-4 font-body text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-[#a9a5e6] focus:ring-2 focus:ring-[#c2c0ef]/50"
            />
          </div>
          <p className="mt-2 font-body text-xs text-ink-soft/80">{jdHint}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={run}
              disabled={!jd.trim() || state === "working"}
              style={{ backgroundColor: "#c2c0ef" }}
              className="rounded-full px-5 py-2 font-body text-sm font-semibold text-ink ring-1 ring-white/70 transition hover:brightness-[0.97] disabled:opacity-50"
            >
              {state === "working" ? "reading it ✦" : "match this posting"}
            </button>
            {filtering && (
              <button
                type="button"
                onClick={() => {
                  setMatch(null);
                  setJd("");
                }}
                className="font-body text-xs font-semibold text-ink-soft/80 transition hover:text-ink"
              >
                ✕ clear
              </button>
            )}
            {state === "error" && (
              <span className="font-body text-xs text-ink-soft">that did not work. try again?</span>
            )}
          </div>
          {match?.summary && (
            <p className="mt-4 max-w-2xl font-body text-[15px] leading-relaxed text-ink-soft">
              {match.summary}
            </p>
          )}
          {match && match.gaps.length > 0 && (
            <p className="mt-2 font-body text-xs text-ink-soft/70">
              not evidenced here: {match.gaps.join(" · ")}
            </p>
          )}
        </section>
      </div>

      {(filtering || projects.length > 0) && (
        <>
      <h2 className="mt-14 font-body text-2xl font-bold text-ink">{projectsLabel} 🌱</h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        {filtering ? "the ones closest to that posting ✦" : projectsHint}
      </p>
      <RecruiterProjects
        projects={shownProjects}
        slugs={shownSlugs}
        // a filtered set has nothing prefetched: the cards ask for their own
        studies={filtering ? shownProjects.map(() => null) : studies}
        pipelines={filtering ? shownProjects.map(() => null) : pipelines}
        images={filtering ? shownProjects.map((p) => p.image) : images}
      />
        </>
      )}

      <FilledNotes.Provider value={shownAngles}>{children}</FilledNotes.Provider>

      {shownSkills.length > 0 && (
        <>
      <h2 className="mt-14 font-body text-2xl font-bold text-ink">{skillsLabel} 🛠️</h2>
      {filtering && (
        <p className="mt-1 font-body text-sm text-ink-soft">
          the ones that posting asks for, that she can show ✦
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        {shownSkills.map((s) => (
          <span
            key={s}
            className="rounded-full bg-white/70 px-4 py-1.5 font-body text-sm font-semibold text-ink-soft"
          >
            {s}
          </span>
        ))}
      </div>
        </>
      )}
    </>
  );
}
