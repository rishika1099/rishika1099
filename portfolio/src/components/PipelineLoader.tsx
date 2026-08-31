"use client";

import { useEffect, useState } from "react";
import PipelineDiagram from "@/components/PipelineDiagram";
import type { Pipeline } from "@/lib/pipeline";

/**
 * Asks for a project's diagram when the page had none cached.
 *
 * The generation is one small model call per project, ever, so it cannot happen
 * while a recruiter waits for the page: the server renders whatever is already
 * cached and this fills in the rest afterwards. Once built, the next visitor
 * gets it in the HTML.
 *
 * A project whose readme has no pipeline in it resolves to nothing at all,
 * which is the right answer: better an absent picture than an invented one.
 */
export default function PipelineLoader({ slug, name }: { slug: string; name: string }) {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/pipeline?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { pipeline?: Pipeline | null }) => {
        if (live) {
          setPipeline(d.pipeline ?? null);
          setDone(true);
        }
      })
      .catch(() => live && setDone(true));
    return () => {
      live = false;
    };
  }, [slug]);

  if (pipeline) return <PipelineDiagram pipeline={pipeline} label={name} />;
  if (done) return null;

  return (
    <div className="mt-5 flex h-24 items-center justify-center rounded-2xl bg-white/40">
      <p className="font-body text-[12px] text-ink-soft/60">reading the repo ✦</p>
    </div>
  );
}
