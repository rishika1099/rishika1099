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
//
// The one section that does change content is Projects, which takes the role's
// own projects (see projectsForRole below).

import type { ResumeEntry, ResumeSection } from "@/lib/resumeTex";
import type { Project } from "@/data/projects";
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

// ---------------------------------------------------------------- projects

const escHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const link = (href: string) =>
  /^https?:\/\//i.test(href)
    ? `<a href="${escHtml(href)}" target="_blank" rel="noreferrer">${escHtml(
        href.replace(/^https?:\/\//i, "").replace(/\/$/, ""),
      )}</a>`
    : "";

/** The portfolio's own description of a project, as at most two resume lines. */
function blurbLines(blurb: string): string[] {
  const text = blurb
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map(escHtml);
}

/**
 * The resume's Projects section, holding the projects this role's page leads
 * with.
 *
 * The resume lists three projects, and every role shared them: an AI Product
 * Manager was shown the KV-cache work and the clinical RAG, while the page
 * beside it led with the complaint queue and the lease check. Here the section
 * takes the role's own first projects, the same ones as its cards.
 *
 * Still her words, never a model's. A project already on the resume keeps its
 * resume lines untouched; one that is not is written from the portfolio's
 * description of it, the text she wrote or approved for the project's card,
 * with its repository and demo as the links. The rest of the resume is left
 * alone.
 */
export function projectsForRole(
  sections: ResumeSection[],
  lead: Project[],
): ResumeSection[] {
  const at = sections.findIndex((s) => /project/i.test(norm(s.title)));
  if (at === -1 || !lead.length) return sections;
  const section = sections[at];
  const count = Math.max(section.entries.length, 3);

  // Matched on the name with punctuation ignored, or on the repository. Both,
  // because each alone misses one: "KV Cache" on the resume is "KV-Cache" on
  // the card, and its resume link still names the repository before a rename.
  const bare = (s: string) => norm(s).replace(/[^a-z0-9]+/g, "");
  const slugOf = (p: Project) => (p.repo.split("/").pop() ?? "").toLowerCase();
  const onResume = (p: Project) =>
    section.entries.find((e) => {
      const hrefs = `${e.right} ${e.subLeft ?? ""} ${e.subRight ?? ""}`.toLowerCase();
      return bare(e.left) === bare(p.name) || (!!slugOf(p) && hrefs.includes(`/${slugOf(p)}`));
    });

  const chosen: ResumeEntry[] = [];
  const used = new Set<ResumeEntry>();
  for (const p of lead.slice(0, count)) {
    const existing = onResume(p);
    if (existing) {
      if (used.has(existing)) continue;
      used.add(existing);
      chosen.push(existing);
      continue;
    }
    const bullets = blurbLines(p.blurb);
    if (!bullets.length) continue;
    chosen.push({
      left: escHtml(p.name),
      right: [link(p.repo), p.demo ? link(p.demo) : ""].filter(Boolean).join(" | "),
      bullets,
    });
  }
  // a role with fewer projects of its own than the resume has keeps the rest
  for (const e of section.entries) {
    if (chosen.length >= count) break;
    if (!used.has(e) && !chosen.includes(e)) chosen.push(e);
  }

  const next = [...sections];
  next[at] = { ...section, entries: chosen };
  return next;
}
