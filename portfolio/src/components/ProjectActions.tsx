"use client";

import Link from "next/link";

/**
 * The two small actions the work cards carry, on the recruiter cards.
 *
 * "ask about this" is the same everywhere: it fires the event the ask box
 * listens for, and the ask box is mounted site-wide.
 *
 * "find similar" cannot be. On /work it filters the grid it sits in, and there
 * is no grid here, so it hands the project name to /work in the URL and the
 * search runs there.
 */
export default function ProjectActions({ name }: { name: string }) {
  return (
    <div className="flex flex-wrap gap-3 pt-3">
      <Link
        href={`/work?similar=${encodeURIComponent(name)}`}
        className="text-left font-body text-xs font-semibold text-ink-soft/80 transition hover:text-ink"
      >
        ✦ find similar
      </Link>
      <button
        type="button"
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("ask-question", {
              detail: `Walk me through the "${name}" project: what it does, how it's built, and what makes it interesting.`,
            }),
          )
        }
        className="text-left font-body text-xs font-semibold text-ink-soft/80 transition hover:text-ink"
      >
        💬 ask about this
      </button>
    </div>
  );
}
