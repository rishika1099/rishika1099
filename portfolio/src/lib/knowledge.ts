import { bio, education, timeline, skillAreas, type Entry } from "@/data/about";
import { getAllProjects } from "@/lib/github-projects";
import { getReadmeSnippet } from "@/lib/github-readme";

export type ChunkKind =
  | "bio"
  | "skills"
  | "experience"
  | "research"
  | "education"
  | "project";

export interface Chunk {
  id: string;
  title: string;
  kind: ChunkKind;
  text: string;
  href?: string;
}

function clean(s: string): string {
  return s.replace(/\*\*/g, "").trim();
}

function entryText(e: Entry): string {
  const head = `${e.title} at ${e.place} (${e.when}). ${e.note}`;
  const details = (e.details ?? []).map(clean).join(" ");
  return clean(`${head} ${details}`);
}

/**
 * Assemble everything the chatbot is allowed to talk about. Poems and photos
 * are intentionally excluded (private / gated content).
 */
export async function buildKnowledge(): Promise<Chunk[]> {
  const chunks: Chunk[] = [];

  chunks.push({
    id: "bio",
    title: "About Rishika",
    kind: "bio",
    text: bio.map(clean).join(" "),
    href: "/about",
  });

  chunks.push({
    id: "skills",
    title: "Skills & focus areas",
    kind: "skills",
    text: `Rishika works across these areas: ${skillAreas.join(", ")}.`,
    href: "/about",
  });

  for (const e of education) {
    chunks.push({
      id: `edu:${e.title}`,
      title: e.title,
      kind: "education",
      text: entryText(e),
      href: "/about",
    });
  }

  for (const e of timeline) {
    const isResearch = e.title.startsWith("Research Assistant");
    chunks.push({
      id: `exp:${e.title}`,
      title: e.title,
      kind: isResearch ? "research" : "experience",
      text: entryText(e),
      href: "/about",
    });
  }

  const projects = await getAllProjects();
  // Pull each project's README in parallel so the bot understands the details,
  // not just the one-line blurb. Fetches are cached; failures degrade silently.
  const readmes = await Promise.all(projects.map((p) => getReadmeSnippet(p.repo)));
  projects.forEach((p, idx) => {
    const bits = [
      `${p.name}: ${p.blurb}`,
      p.categories?.length ? `Areas: ${p.categories.join(", ")}.` : "",
      p.domains?.length ? `Domains: ${p.domains.join(", ")}.` : "",
      p.tags?.length ? `Tech: ${p.tags.join(", ")}.` : "",
      readmes[idx] ? `Details: ${readmes[idx]}` : "",
    ].filter(Boolean);
    chunks.push({
      id: `proj:${p.name}`,
      title: p.name,
      kind: "project",
      text: bits.join(" "),
      href: p.demo ?? p.repo,
    });
  });

  return chunks;
}
