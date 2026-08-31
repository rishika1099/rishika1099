// A plain reading of the same material, for someone hiring for one specific
// role. The rest of the site is built for wandering: shelves, a galaxy, an
// explain-like-I'm-five toggle. A recruiter with forty tabs open wants the
// evidence for the job they are filling, in one column, in one scroll.
//
// Nothing here is a second copy of the content. It reads the same projects and
// the same About entries, and only decides what is relevant and in what order.

import type { Category, Project } from "@/data/projects";
import type { Entry } from "@/data/about";
import { richToText } from "@/lib/richHtml";

export const ROLES = ["data-scientist", "ml-engineer", "ai-engineer"] as const;
export type Role = (typeof ROLES)[number];

export const isRole = (v: unknown): v is Role => ROLES.includes(v as Role);

interface RoleSpec {
  label: string;
  /** what the role is called in a sentence, e.g. "a Data Scientist" */
  article: string;
  /**
   * The technical areas that count as evidence for this role, best first. A
   * project matching an earlier area outranks one matching a later area, so the
   * order is the ranking, not just the filter.
   */
  areas: Category[];
  /**
   * The skills worth listing, in the order they should be read. One skill per
   * entry: they render as separate bubbles, so "Python, R and SQL" would be a
   * single bubble with a list inside it rather than three things she knows.
   */
  skills: string[];
}

export const ROLE_SPECS: Record<Role, RoleSpec> = {
  "data-scientist": {
    label: "Data Scientist",
    article: "a Data Scientist",
    areas: [
      "Causal Inference",
      "Statistical Modeling",
      "Predictive Analysis",
      "Machine Learning",
    ],
    skills: [
      "Causal inference",
      "Experimentation",
      "A/B testing",
      "Statistical modeling",
      "Predictive modeling",
      "Explainability",
      "Fairness auditing",
      "Python",
      "R",
      "SQL",
    ],
  },
  "ml-engineer": {
    label: "Machine Learning Engineer",
    article: "a Machine Learning Engineer",
    areas: [
      "High Performance Machine Learning",
      "Deep Learning",
      "Computer Vision",
      "Machine Learning",
      "Predictive Analysis",
    ],
    skills: [
      "Model training",
      "Evaluation",
      "Deep learning",
      "PyTorch",
      "Inference optimisation",
      "Quantisation",
      "CUDA",
      "Triton",
      "Computer vision",
      "Pipelines",
      "Deployment",
      "Python",
      "SQL",
    ],
  },
  "ai-engineer": {
    label: "AI Engineer",
    article: "an AI Engineer",
    areas: ["Generative AI", "Agentic AI", "NLP", "Deep Learning"],
    skills: [
      "LLM systems",
      "RAG",
      "Agent orchestration",
      "Evaluation harnesses",
      "Guardrails",
      "Prompt engineering",
      "Context engineering",
      "NLP",
      "Python",
      "TypeScript",
    ],
  },
};

/**
 * The projects that are evidence for this role, strongest first.
 *
 * Scored rather than filtered: a project is worth more for matching a leading
 * area than a trailing one, and one that matches two areas beats one that
 * matches one. Relevance decides who is eligible; whether she wrote the project
 * up decides the order among the eligible, which is weighted far higher because
 * area tags alone cannot tell a flagship from a weekend experiment.
 */
export function projectsForRole(projects: Project[], role: Role, limit = 6): Project[] {
  const { areas } = ROLE_SPECS[role];
  const scored = projects
    .map((p) => {
      let score = 0;
      for (const c of p.categories) {
        const rank = areas.indexOf(c);
        if (rank !== -1) score += areas.length - rank;
      }
      if (!score) return { p, score: 0 };
      // Weighted well above area matching. Dozens of small experiments carry a
      // generic area tag and tie on it, and a tie broken alphabetically put
      // "Car Price Prediction" above her flagship work. What separates them is
      // not the tag: it is whether she wrote the project up, and whether she
      // marked it her best.
      if (p.curated) score += 12;
      if (p.featured) score += 8;
      // a demo or a write-up is something a recruiter can actually open
      if (p.demo) score += 2;
      if (p.article || p.results) score += 2;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name));

  return scored.slice(0, limit).map((x) => x.p);
}

/** Research entries whose areas overlap the role, strongest first. */
export function researchForRole(research: Entry[], role: Role): Entry[] {
  const { areas } = ROLE_SPECS[role];
  const scored = research
    .map((e) => {
      const tech = (e.tech ?? []) as Category[];
      let score = 0;
      for (const c of tech) {
        const rank = areas.indexOf(c);
        if (rank !== -1) score += areas.length - rank;
      }
      return { e, score };
    })
    .sort((a, b) => b.score - a.score);

  // Everything she has done research on is worth showing: four entries is not a
  // wall of text, and a recruiter reading this wants the whole picture. The
  // score only decides what comes first.
  return scored.map((x) => x.e);
}

/** Plain text of an entry, for a page that renders no rich formatting. */
export const plain = (s: string | undefined, max = 400) => (s ? richToText(s, max) : "");
