"use client";

import { useEffect, useState } from "react";
import { Carousel } from "@/components/Carousel";
import EntryCard, { FilledNotes } from "@/components/EntryCard";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import SkillGraph from "@/components/SkillGraph";
import type { Entry } from "@/data/about";
import { isResearchEntry } from "@/lib/aboutSections";
import SectionNav from "@/components/SectionNav";

export default function AboutClient({
  education,
  timeline,
  certifications = [],
  bioHtml,
  title,
  heads,
  navLabels,
}: {
  education: Entry[];
  timeline: Entry[];
  certifications?: Entry[];
  bioHtml: string;
  title: React.ReactNode;
  navLabels: {
    education: string;
    skills: string;
    work: string;
    research: string;
    certifications: string;
  };
  heads: {
    education: React.ReactNode;
    skills: React.ReactNode;
    skillsSub: React.ReactNode;
    work: React.ReactNode;
    research: React.ReactNode;
    certifications: React.ReactNode;
  };
}) {
  // the About cards get the same fill the project cards do, from each entry's
  // own details rather than from a readme
  const [noteFills, setNoteFills] = useState<Record<string, string>>({});
  useEffect(() => {
    let live = true;
    fetch("/api/explain?level=default&of=about")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { blurbs?: Record<string, string> }) => {
        if (live) setNoteFills(d.blurbs ?? {});
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  return (
    <FilledNotes.Provider value={noteFills}>
    <PageShell vibe="lilac">
      <PageTitle>{title}</PageTitle>

      <div
        className="rich-passage mt-6 max-w-4xl font-body text-lg text-ink-soft"
        // written in the atelier's ink editor; sanitized at save
        dangerouslySetInnerHTML={{ __html: bioHtml }}
      />

      <div className="mt-6 flex flex-col items-center gap-2">
        <a
          href="/resume"
          className="inline-flex items-center gap-2 rounded-full bg-blush/80 px-7 py-3 font-body text-lg font-semibold text-ink shadow-lg shadow-ink/20 transition hover:scale-105"
        >
          👀 peek at my resume
        </a>
        <a
          href="/resume/print"
          className="font-body text-sm text-ink-soft underline decoration-blush/60 underline-offset-4 hover:text-ink"
        >
          or read it as a page
        </a>
      </div>

      <SectionNav
        sections={[
          { id: "education", label: navLabels.education },
          { id: "skills", label: navLabels.skills },
          { id: "work", label: navLabels.work },
          { id: "research", label: navLabels.research },
          ...(certifications.length
            ? [{ id: "certifications", label: navLabels.certifications }]
            : []),
        ]}
      />

      {/* Education */}
      <h2 id="education" className="mt-12 scroll-mt-32 font-body text-2xl font-bold text-ink">
        {heads.education}
      </h2>
      {/* Two degrees side by side rather than stacked: each card's text is
          short enough for half the container, and it saves a screenful before
          the reader has even reached the work history. */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {education.map((e, i) => (
          <EntryCard key={e.title} entry={e} i={i} showAttachments />
        ))}
      </div>

      {/* Skills */}
      <h2 id="skills" className="mt-12 scroll-mt-32 font-body text-2xl font-bold text-ink">
        {heads.skills}
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        {heads.skillsSub}
      </p>
      <SkillGraph />

      {/* Jobs */}
      <h2 id="work" className="mt-12 scroll-mt-32 font-body text-2xl font-bold text-ink">
        {heads.work}
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        tap a card to read the details ✦
      </p>
      {/* One after another, not a grid: these are in date order and the stack
          is what makes that read as a timeline. Research is a grid because
          those four run in parallel rather than in sequence. */}
      <div className="mt-5 space-y-4">
        {timeline
          .filter((t) => !isResearchEntry(t))
          .map((t, i) => (
            <EntryCard key={t.title} entry={t} i={i} showFiles />
          ))}
      </div>

      {/* Research */}
      <h2 id="research" className="mt-12 scroll-mt-32 font-body text-2xl font-bold text-ink">
        {heads.research}
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        tap a card to read the details ✦
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {timeline
          .filter(isResearchEntry)
          .map((t, i) => (
            <EntryCard key={t.title} entry={t} i={i} />
          ))}
      </div>

      {/* Certifications & short courses (only when there are any) */}
      {certifications.length > 0 && (
        <>
          <h2 id="certifications" className="mt-12 scroll-mt-32 font-body text-2xl font-bold text-ink">{heads.certifications}</h2>
          {/* A shelf rather than a stack: six of these ran to 1344px, a quarter
              of the whole page and more than work or research took. Same
              carousel the project shelves use. */}
          <div className="mt-5">
            <Carousel label="certification">
              {certifications.map((e, i) => (
                <EntryCard
                  key={e.title}
                  entry={e}
                  i={i}
                  noMark
                  showAttachments
                  className="w-[21rem] shrink-0 snap-start"
                />
              ))}
            </Carousel>
          </div>
        </>
      )}
    </PageShell>
    </FilledNotes.Provider>
  );
}
