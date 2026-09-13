import Link from "next/link";

/**
 * The resume on the page, rather than a link to it.
 *
 * A recruiter reading a role's page should be able to read the resume without
 * leaving for a PDF and finding their way back. It sits in a window of its own
 * that scrolls inside the page, because this page already carries projects,
 * research, experience, education and skills, and everything below it still
 * has to be reachable. The first version cut the sheet off under a fade with a
 * button to open the rest, which read as a page torn off halfway.
 */
export default function ResumePreview({
  children,
  downloadLabel,
  pageLabel,
}: {
  children: React.ReactNode;
  downloadLabel: string;
  pageLabel: string;
}) {
  return (
    <div>
      {/* Focusable, so the window can be scrolled from the keyboard too. Shorter
          on a phone, where a window nearly the height of the screen leaves no
          page around it to scroll past it by. */}
      <div
        tabIndex={0}
        role="region"
        aria-label="résumé"
        className="resume-scroll max-h-[26rem] overflow-y-auto sm:max-h-[34rem] rounded-3xl bg-white/85 px-6 pb-6 pt-1 shadow-sm ring-1 ring-white/70 outline-none focus-visible:ring-2 focus-visible:ring-[#a9a5e6] sm:px-8"
      >
        <div className="resume-sheet">{children}</div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-body text-sm">
        <a
          href="/resume"
          download="Rishika_Mamidibathula_Resume.pdf"
          style={{ backgroundColor: "#d3d1f5" }}
          className="rounded-full px-4 py-1.5 font-semibold text-ink ring-1 ring-white/70 transition hover:brightness-[0.97]"
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
