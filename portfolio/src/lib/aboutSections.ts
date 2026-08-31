// Work and research are one `timeline` array split into two sections. The split
// used to be a string match on the card's title, which made the title do two
// jobs: name the role, and decide where it lived. Trimming a prefix off four
// research titles moved all four into work. The section is a stored field now;
// this is the one place that reads it.

import type { Entry } from "@/data/about";
import { richToText } from "@/lib/richHtml";

export type EntrySection = "work" | "research";

// Entries saved since the field exists carry it. Older ones are placed by the
// rule that used to decide it, so nothing relocates on its own; once the field
// is set, the title is never consulted again.
export function entrySection(e: Entry): EntrySection {
  if (e.section === "work" || e.section === "research") return e.section;
  return richToText(e.title).includes("Research Assistant") ? "research" : "work";
}

export const isResearchEntry = (e: Entry) => entrySection(e) === "research";

// Stamp the section an entry was filed under, so it stays there through any
// later rename. Called when the editors save, where the cluster the card sits
// in is the answer.
export const stampSection = <T extends Entry>(e: T, section: EntrySection): T => ({
  ...e,
  section,
});
