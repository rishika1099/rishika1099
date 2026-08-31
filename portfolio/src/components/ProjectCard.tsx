"use client";

/**
 * The project card, and the pieces it is built from.
 *
 * Lives here rather than inside the work gallery because the recruiter page
 * shows a selection of the same projects and should show the same card: two
 * renderings of one project that drift apart is exactly the bug this avoids.
 */

import { m } from "framer-motion";
import Link from "next/link";
import type { Category, Domain, Project } from "@/data/projects";
import { categoryStyle, domainColor, domainEmoji } from "@/data/projects";

// blurbs written in the ink editor are HTML; older ones are plain text
export const isHtml = (s: string) => /<[a-z][\s\S]*>/i.test(s);
export function Blurb({ text }: { text: string }) {
  return isHtml(text) ? (
    <span
      className="rich-passage mt-3 block font-body text-sm text-ink-soft"
      dangerouslySetInnerHTML={{ __html: text }}
    />
  ) : (
    <p className="mt-3 font-body text-sm text-ink-soft">{text}</p>
  );
}

export function Links({ p }: { p: Pick<Project, "repo" | "demo" | "results" | "article"> }) {
  return (
    <div className="mt-auto flex flex-wrap gap-2 pt-3">
      <a
        href={p.repo}
        target="_blank"
        rel="noreferrer"
        className="rounded-full bg-ink/90 px-3 py-1 font-body text-xs font-semibold text-cream transition hover:scale-105"
      >
        ⭑ Code
      </a>
      {p.demo && (
        <a
          href={p.demo}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-blush/80 px-3 py-1 font-body text-xs font-semibold text-ink transition hover:scale-105"
        >
          ✿ Live demo
        </a>
      )}
      {p.results && (
        <a
          href={p.results}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-mint/80 px-3 py-1 font-body text-xs font-semibold text-ink transition hover:scale-105"
        >
          📊 Results
        </a>
      )}
      {p.article && (
        <a
          href={p.article}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-gold/70 px-3 py-1 font-body text-xs font-semibold text-ink transition hover:scale-105"
        >
          📰 Article
        </a>
      )}
    </div>
  );
}


export function DomainChips({ domains }: { domains?: Domain[] }) {
  if (!domains?.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {domains.map((d) => (
        <span
          key={d}
          style={{ backgroundColor: domainColor[d] ?? "#e6d7f5" }}
          className="rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink"
        >
          {domainEmoji[d] ?? "✦"} {d}
        </span>
      ))}
    </div>
  );
}

export function TechChips({ categories }: { categories: Category[] }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {categories.map((c) => (
        <span
          key={c}
          style={{ backgroundColor: categoryStyle[c]?.color ?? "#d8efe2" }}
          className="rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink"
        >
          {categoryStyle[c]?.emoji ?? "✦"} {c}
        </span>
      ))}
    </div>
  );
}

/** What every card carries under its title. Order is deliberate: the chips say
 *  what a project *is* and belong with the name, the links say what you can *do*
 *  with it and sit at the foot of the card, and the description separates the
 *  two so identity and actions never read as one run-on pile of pills. */
export function CardBody({
  p,
  blurb,
}: {
  p: {
    categories: Category[];
    domains?: Domain[];
    repo: string;
    demo?: string;
    results?: string;
    article?: string;
  };
  blurb: string;
}) {
  return (
    <>
      <DomainChips domains={p.domains} />
      <TechChips categories={p.categories} />
      <Blurb text={blurb} />
      <Links p={p} />
    </>
  );
}

export interface SearchHit {
  name: string;
  blurb: string;
  emoji: string;
  repo: string;
  demo?: string;
  categories: Category[];
  domains?: Domain[];
  score: number;
}

export type SearchStatus = "idle" | "loading" | "done" | "error" | "off";

// Raw cosine from text-embedding-3-small lives in a narrow band (~0.15 for
// unrelated, ~0.55 for a strong hit). Map that usable band onto 0..100% so the
// badge reads as an intuitive relevance score rather than a deceptively low number.
const REL_LO = 0.18;
const REL_HI = 0.52;
function relevancePct(score: number): number {
  const t = (score - REL_LO) / (REL_HI - REL_LO);
  return Math.round(Math.max(0, Math.min(1, t)) * 100);
}

export function ScoreBadge({ score }: { score: number }) {
  const pct = relevancePct(score);
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-lavender/70 px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink">
      ✦ {pct}% match
    </span>
  );
}

// Card footer actions: "find similar" narrows the grid by embedding
// similarity; "ask about this" opens the chatbot pre-loaded with the project.
export function CardActions({ name, onSimilar }: { name: string; onSimilar?: () => void }) {
  return (
    <div className="flex flex-wrap gap-3 pt-3">
      {onSimilar ? (
        <button
          type="button"
          onClick={onSimilar}
          className="text-left font-body text-xs font-semibold text-ink-soft/80 transition hover:text-ink"
        >
          ✦ find similar
        </button>
      ) : (
        // no grid on this page to narrow, so the search runs on the one that has it
        <Link
          href={`/work?similar=${encodeURIComponent(name)}`}
          className="text-left font-body text-xs font-semibold text-ink-soft/80 transition hover:text-ink"
        >
          ✦ find similar
        </Link>
      )}
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

/** One project card. Shared by the carousel and the grid so they can't drift. */
export default function ProjectCard({
  p,
  blurb,
  onSimilar,
  className = "",
  children,
}: {
  p: Project;
  blurb: string;
  /** omitted where there is no grid to filter, which makes it a link instead */
  onSimilar?: () => void;
  className?: string;
  /** anything the page wants under the actions, e.g. a case study opener */
  children?: React.ReactNode;
}) {
  return (
    <m.article
      layout
      data-carousel-item
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.22 }}
      whileHover={{ y: -5 }}
      className={`flex flex-col rounded-3xl p-5 soft-card ${className}`}
    >
      <span className="text-3xl">{p.emoji}</span>
      <h3 className="mt-1.5 font-body text-base font-bold text-ink">{p.name}</h3>
      <CardBody p={p} blurb={blurb} />
      <CardActions name={p.name} onSimilar={onSimilar} />
      {children}
    </m.article>
  );
}
