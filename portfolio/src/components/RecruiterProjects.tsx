"use client";

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
 * screenshot and the architecture diagram now live. They were on the card and
 * made it very tall for something a recruiter is scanning; behind the click
 * they are the reward for being interested rather than a wall to get past.
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
  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      {projects.map((p, i) => (
        <ProjectCard key={p.name} p={p} blurb={p.blurb}>
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
