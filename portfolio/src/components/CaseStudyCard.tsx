"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CaseStudy } from "@/lib/caseStudies";
import PipelineDiagram from "@/components/PipelineDiagram";
import type { Pipeline } from "@/lib/pipeline";

/**
 * The deep dive on a project, opened from its card.
 *
 * A recruiter reading the short version should be able to go one level deeper
 * on the two or three projects they care about without leaving the page and
 * losing the role they picked. So it is the same dialog the About entries use:
 * click the card, read the whole thing, close it, still here.
 */

export default function CaseStudyOpener({
  study,
  name,
  pipeline,
  image,
}: {
  study: CaseStudy;
  name: string;
  /** the stages read out of the repo, drawn as the architecture at a glance */
  pipeline?: Pipeline | null;
  /** a screenshot of it running, if she has uploaded one */
  image?: { id: string; name: string };
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-1.5 font-body text-sm font-semibold text-ink-soft transition hover:bg-white hover:text-ink"
      >
        ⤢ read the case study
      </button>
      {open && (
        <CaseStudyDialog
          study={study}
          name={name}
          pipeline={pipeline}
          image={image}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function CaseStudyDialog({
  study,
  name,
  pipeline,
  image,
  onClose,
}: {
  study: CaseStudy;
  name: string;
  pipeline?: Pipeline | null;
  image?: { id: string; name: string };
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // the page behind must not scroll while the sheet is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${name}: case study`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        // the ground of whatever page opened it, published by PageShell
        style={{ backgroundColor: "var(--page-surface, #fff8f0)" }}
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-body text-2xl font-bold text-ink">{name}</h2>
            {study.tagline && (
              <p className="mt-1 font-body text-[15px] text-ink-soft">{study.tagline}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="close"
            className="shrink-0 rounded-full bg-white/70 px-3 py-1 font-body text-sm font-semibold text-ink-soft transition hover:bg-white hover:text-ink"
          >
            ✕
          </button>
        </div>

        {study.metrics.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-3">
            {study.metrics.map((m) => (
              <div
                key={`${m.label}-${m.value}`}
                className="rounded-2xl bg-white/70 px-4 py-2.5 ring-1 ring-white/70"
              >
                <div className="font-body text-lg font-bold text-ink">{m.value}</div>
                <div className="font-body text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {image && (
          <figure className="mt-6 overflow-hidden rounded-2xl bg-white/70 ring-1 ring-white/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/attachment/${image.id}`}
              alt={`${name} screenshot`}
              loading="lazy"
              decoding="async"
              className="w-full"
            />
          </figure>
        )}

        {pipeline && (
          <section className="mt-6">
            <h3 className="font-body text-base font-bold text-ink">Architecture</h3>
            <PipelineDiagram pipeline={pipeline} label={name} />
          </section>
        )}

        {study.body && (
          <div
            className="rich-passage mt-6 font-body text-[15px] leading-relaxed text-ink-soft [&_h2]:mt-6 [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-5 [&_h3]:font-bold [&_h3]:text-ink [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: study.body }}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
