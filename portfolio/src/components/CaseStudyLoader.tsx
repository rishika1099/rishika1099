"use client";

import { useEffect, useState } from "react";
import CaseStudyOpener from "@/components/CaseStudyCard";
import type { CaseStudy } from "@/lib/caseStudies";
import type { Pipeline } from "@/lib/pipeline";

/**
 * Asks for a project's drafted case study when the page had none cached.
 *
 * Same shape as the pipeline loader: the server renders whatever is already
 * cached, and anything missing is fetched afterwards, so nobody waits on a
 * model call. A project whose readme is too thin resolves to nothing, and the
 * card simply has no case study, which is the honest outcome.
 */
export default function CaseStudyLoader({
  slug,
  name,
  pipeline,
}: {
  slug: string;
  name: string;
  pipeline?: Pipeline | null;
}) {
  const [study, setStudy] = useState<CaseStudy | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/case-study?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { caseStudy?: CaseStudy | null }) => live && setStudy(d.caseStudy ?? null))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [slug]);

  if (!study) return null;
  return <CaseStudyOpener study={study} name={name} pipeline={pipeline} />;
}
