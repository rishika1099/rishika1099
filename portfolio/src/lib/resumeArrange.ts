// The same resume, arranged for one role.
//
// Nothing is removed and nothing is rewritten: every entry and every bullet she
// wrote is still there, in the same words. What changes is the order. The
// entries this role calls for rise to the top of their section, and inside
// those entries the lines it calls for come first, so a recruiter reads the
// part that answers them without having to look for it.
//
// It reuses the choice already made for the role's "From the resume" lines, so
// the arrangement and that list can never disagree, and it costs no extra call.

import type { ResumeSection } from "@/lib/resumeTex";
import type { TailoredEntry } from "@/lib/tailor";

// the picks carry plain text, the parsed resume carries HTML
const norm = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

export function arrangeForRole(
  sections: ResumeSection[],
  picks: TailoredEntry[],
): ResumeSection[] {
  if (!picks.length) return sections;
  const rank = new Map(picks.map((p, i) => [norm(p.title), i]));
  const wanted = new Map(picks.map((p) => [norm(p.title), new Set(p.bullets.map(norm))]));

  return sections.map((section) => {
    // sorted by rank, ties keeping the order she wrote them in
    const entries = section.entries
      .map((e, i) => ({ e, i }))
      .sort((a, b) => {
        const ra = rank.get(norm(a.e.left)) ?? Number.POSITIVE_INFINITY;
        const rb = rank.get(norm(b.e.left)) ?? Number.POSITIVE_INFINITY;
        return ra - rb || a.i - b.i;
      })
      .map(({ e }) => {
        const want = wanted.get(norm(e.left));
        if (!want?.size) return e;
        const bullets = [...e.bullets].sort(
          (x, y) => Number(want.has(norm(y))) - Number(want.has(norm(x))),
        );
        return { ...e, bullets };
      });
    return { ...section, entries };
  });
}
