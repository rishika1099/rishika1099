"use client";

import { useEffect, useState } from "react";

// A slim jump bar for a long page. Real anchor links, so it works without JS,
// is keyboard and screen-reader navigable, and /about#research is shareable.
//
// Given `value` and `onSelect` it becomes a tab bar instead: the same pills,
// still real anchors so the hash keeps working, but each one shows its section
// rather than scrolling to it. The pills wrap in that mode instead of scrolling
// sideways, since with one section showing there is no scroll position for the
// active pill to follow.

export interface NavSection {
  id: string;
  label: string;
}

export default function SectionNav({
  sections,
  value,
  onSelect,
}: {
  sections: NavSection[];
  /** the open section, when this bar is driving tabs rather than scrolling */
  value?: string;
  onSelect?: (id: string) => void;
}) {
  const tabs = !!onSelect;
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const current = tabs ? value ?? sections[0]?.id ?? "" : active;

  useEffect(() => {
    // nothing to follow when only one section is on the page at a time
    if (tabs) return;
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
  }, [sections, tabs]);

  return (
    <nav
      aria-label={tabs ? "sections" : "jump to a section"}
      className="sticky top-20 z-30 -mx-4 mt-8 px-4 sm:mx-0 sm:px-0"
    >
      <ul
        role={tabs ? "tablist" : undefined}
        className={`mx-auto flex max-w-full gap-2 p-1.5 soft-card ${
          tabs
            ? "w-fit flex-wrap justify-center rounded-3xl"
            : "w-fit snap-x snap-mandatory overflow-x-auto rounded-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible"
        }`}
      >
        {sections.map((s) => {
          const on = current === s.id;
          return (
            <li key={s.id} className="snap-start">
              <a
                href={`#${s.id}`}
                role={tabs ? "tab" : undefined}
                aria-selected={tabs ? on : undefined}
                aria-current={!tabs && on ? "true" : undefined}
                onClick={onSelect ? () => onSelect(s.id) : undefined}
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
