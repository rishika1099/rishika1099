"use client";

import { useRef, useState } from "react";
import ProjectCard from "@/components/ProjectCard";
import CaseStudyOpener from "@/components/CaseStudyCard";
import CaseStudyLoader from "@/components/CaseStudyLoader";
import type { Project } from "@/data/projects";
import type { CaseStudy } from "@/lib/caseStudies";
import type { Pipeline } from "@/lib/pipeline";

/**
 * The work page's project card, on the recruiter page.
 *
 * The card itself is unchanged: same emoji, chips, blurb, links and the two
 * small actions. What hangs under it is the way into the deep dive, where the
 * screenshot and the architecture diagram live. They were on the card and made
 * it very tall for something a recruiter is scanning; behind the click they are
 * the reward for being interested rather than a wall to get past.
 *
 * "find similar" answers here rather than sending the reader to /work. Losing
 * the role they picked to see three related projects is a bad trade, and the
 * endpoint already returns everything a card needs to be drawn.
 */
export default function RecruiterProjects({
  projects,
  slugs,
  studies,
  pipelines,
  images,
}: {
  projects: Project[];
  slugs: string[];
  studies: (CaseStudy | null)[];
  pipelines: (Pipeline | null)[];
  images: ({ id: string; name: string } | undefined)[];
}) {
  const [similarTo, setSimilarTo] = useState<string | null>(null);
  const [hits, setHits] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  // where the reader was standing when they asked, so going back returns them
  // there rather than to the top of a page they had already scrolled through
  const returnTo = useRef(0);

  async function findSimilar(name: string) {
    if (!similarTo) returnTo.current = window.scrollY;
    setSimilarTo(name);
    setLoading(true);
    setHits([]);
    try {
      const res = await fetch(`/api/related-projects?name=${encodeURIComponent(name)}`);
      const data = (await res.json()) as { results?: Project[] };
      setHits(data.results ?? []);
    } catch {
      setHits([]);
    } finally {
      setLoading(false);
    }
  }

  if (similarTo) {
    return (
      <>
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-white/50 px-4 py-2.5">
          <span className="font-body text-sm text-ink-soft">
            projects like <span className="font-semibold text-ink">{similarTo}</span>
            {!loading && ` · ${hits.length}`}
          </span>
          <button
            type="button"
            onClick={() => {
              setSimilarTo(null);
              // after the grid is back, not before
              requestAnimationFrame(() =>
                requestAnimationFrame(() => window.scrollTo({ top: returnTo.current })),
              );
            }}
            className="ml-auto rounded-full bg-ink/90 px-3 py-1 font-body text-xs font-semibold text-cream transition hover:opacity-90"
          >
            ✕ back to the selection
          </button>
        </div>
        {loading ? (
          <p className="mt-5 font-body text-sm text-ink-soft">looking ✦</p>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {hits.map((h) => (
              <ProjectCard key={h.name} p={h} blurb={h.blurb} onSimilar={() => findSimilar(h.name)} />
            ))}
            {hits.length === 0 && (
              <p className="font-body text-sm text-ink-soft">nothing close enough to show ✦</p>
            )}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      {projects.map((p, i) => (
        <ProjectCard key={p.name} p={p} blurb={p.blurb} onSimilar={() => findSimilar(p.name)}>
          {studies[i] ? (
            <CaseStudyOpener
              study={studies[i]!}
              name={p.name}
              pipeline={pipelines[i]}
              image={images[i]}
            />
          ) : (
            <CaseStudyLoader
              slug={slugs[i]}
              name={p.name}
              pipeline={pipelines[i]}
              image={images[i]}
            />
          )}
        </ProjectCard>
      ))}
    </div>
  );
}
