"use client";

import { useEffect, useState } from "react";

// A slim jump bar for a long page. Real anchor links, so it works without JS,
// is keyboard and screen-reader navigable, and /about#research is shareable.
// The active pill follows the scroll position via IntersectionObserver rather
// than a scroll listener, so it never fights the page for frames.

export interface NavSection {
  id: string;
  label: string;
}

export default function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const nodes = sections
      .map((s) => document.getElementById(s.id))
      .filter((n): n is HTMLElement => !!n);
    if (!nodes.length) return;

    // -45% at the bottom means a heading counts as "current" once it reaches
    // the upper half of the viewport, which matches where the eye actually is
    const io = new IntersectionObserver(
      (entries) => {
        const onScreen = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (onScreen[0]) setActive(onScreen[0].target.id);
      },
      { rootMargin: "-96px 0px -45% 0px", threshold: 0 },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="jump to a section"
      className="sticky top-20 z-30 -mx-4 mt-8 px-4 sm:mx-0 sm:px-0"
    >
      <ul className="mx-auto flex w-fit max-w-full snap-x snap-mandatory gap-2 overflow-x-auto rounded-full p-1.5 soft-card [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible">
        {sections.map((s) => {
          const on = active === s.id;
          return (
            <li key={s.id} className="snap-start">
              <a
                href={`#${s.id}`}
                aria-current={on ? "true" : undefined}
                className={`block whitespace-nowrap rounded-full px-3.5 py-1.5 font-body text-sm font-semibold transition ${
                  on
                    ? "bg-blush text-ink shadow-sm"
                    : "text-ink-soft hover:bg-white/70 hover:text-ink"
                }`}
              >
                {s.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
