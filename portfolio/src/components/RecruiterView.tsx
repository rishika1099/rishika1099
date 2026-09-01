"use client";

import { useEffect, useState } from "react";
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

  // Live, the way the work page searches: no button, the page answers as you
  // type and stops answering when the field is emptied.
  //
  // The wait is longer than that page's 450ms because each run here is a model
  // call rather than a vector lookup, so it holds out for a real pause before
  // spending one. An in-flight request is aborted when the text changes again,
  // so a slow answer to half a sentence cannot land on top of a newer one.
  useEffect(() => {
    const q = jd.trim();
    // emptying the field is handled where it happens, in the change handler:
    // clearing state from inside an effect cascades a second render
    if (!q) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setState("working");
      try {
        const res = await fetch("/api/tailor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jd: q }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error();
        const d = (await res.json()) as { tailored?: Tailored };
        setMatch(d.tailored ?? null);
        setState("idle");
      } catch (err) {
        if ((err as Error).name !== "AbortError") setState("error");
      }
    }, 900);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [jd]);

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
      {/* Laid out exactly like the work page's search: the bar, one thin line
          under it saying what it does, then a labelled row of pills. The bar
          leads because it is the more precise of the two ways to ask, and the
          roles are the shortcut for anyone without a posting to hand. */}
      <div className="mt-7">
        <section>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
              🔍
            </span>
            <input
              type="search"
              value={jd}
              onChange={(e) => {
                const next = e.target.value;
                setJd(next);
                // an emptied field means no question was asked, so the answer
                // to the last one goes with it
                if (!next.trim()) {
                  setMatch(null);
                  setState("idle");
                }
              }}
              placeholder={jdPlaceholder}
              aria-label={jdLabel}
              // the page's own periwinkle on focus, not the site's blush: a pink
              // ring on this ground reads as borrowed from another page
              className="w-full rounded-full border border-white/70 bg-white/80 py-3 pl-11 pr-4 font-body text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-[#a9a5e6] focus:ring-2 focus:ring-[#c2c0ef]/50"
            />
          </div>
          {/* the one line under the bar carries the status too, so nothing
              shifts when it starts reading */}
          <p className="mt-2 font-body text-xs text-ink-soft/80">
            {state === "working"
              ? "reading it ✦"
              : state === "error"
                ? "that did not work. try again?"
                : jdHint}
          </p>
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
        <div className="mt-5">{picker}</div>
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
