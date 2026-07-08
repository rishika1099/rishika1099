"use client";

// The two actions at the top of the resume page. Hidden when printing so they
// never end up in the PDF.
export default function PrintButtons() {
  return (
    <div className="no-print mb-8 flex flex-wrap gap-3">
      <button
        onClick={() => window.print()}
        className="rounded-full bg-ink px-5 py-2 font-body text-sm font-semibold text-cream transition hover:opacity-90"
      >
        🖨 print / save as PDF
      </button>
      <a
        href="/resume"
        className="rounded-full bg-white/70 px-5 py-2 font-body text-sm font-semibold text-ink-soft transition hover:text-ink"
      >
        ⬇ download the original PDF
      </a>
    </div>
  );
}
