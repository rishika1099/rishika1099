"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * The resume on the page, rather than a link to it.
 *
 * A recruiter reading a role's page should be able to read the resume without
 * leaving for a PDF and finding their way back. It opens short, because this
 * page already carries projects, research, experience, education and skills,
 * and everything below the preview still has to be reachable. The rest is one
 * tap away, and the PDF is still there for the ones who file it.
 */
export default function ResumePreview({
  children,
  moreLabel,
  lessLabel,
  downloadLabel,
  pageLabel,
}: {
  children: React.ReactNode;
  moreLabel: string;
  lessLabel: string;
  downloadLabel: string;
  pageLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div
        className={`relative overflow-hidden rounded-3xl bg-white/85 px-6 pb-6 pt-1 shadow-sm ring-1 ring-white/70 sm:px-8 ${
          open ? "" : "max-h-[32rem]"
        }`}
      >
        <div className="resume-sheet">{children}</div>
        {!open && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-white/0 to-white" />
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-body text-sm">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ backgroundColor: "#d3d1f5" }}
          className="rounded-full px-4 py-1.5 font-semibold text-ink ring-1 ring-white/70 transition hover:brightness-[0.97]"
        >
          {open ? lessLabel : moreLabel}
        </button>
        <a
          href="/resume"
          download="Rishika_Mamidibathula_Resume.pdf"
          className="font-semibold text-ink-soft underline decoration-[#a9a5e6] decoration-2 underline-offset-4 transition hover:text-ink"
        >
          {downloadLabel}
        </a>
        <Link
          href="/resume/print"
          className="text-ink-soft underline decoration-[#a9a5e6] decoration-2 underline-offset-4 transition hover:text-ink"
        >
          {pageLabel}
        </Link>
      </div>
    </div>
  );
}
