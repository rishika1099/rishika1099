import OpenAI from "openai";
import { getAllProjects } from "@/lib/github-projects";
import { getReadmeSnippet } from "@/lib/github-readme";
import type { Project } from "@/data/projects";

export interface SearchHit {
  name: string;
  blurb: string;
  emoji: string;
  repo: string;
  demo?: string;
  categories: string[];
  domains?: string[];
  score: number; // cosine similarity, 0..1
}

function projectText(p: Project, readme = ""): string {
  return [p.name, p.blurb, ...(p.categories ?? []), ...(p.domains ?? []), ...(p.tags ?? []), readme]
    .filter(Boolean)
    .join(" . ");
}
function normalize(v: number[]): number[] {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}
function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

// Below this cosine, a project isn't a real match (unrelated text still scores
// ~0.15). Drop those instead of padding the list with weak "0% match" cards.
const MIN_SCORE = 0.24;

// Cache project embeddings per server instance, keyed by the project set.
let cache: { key: string; projects: Project[]; vectors: number[][] } | null = null;

async function ensureCache(openai: OpenAI) {
  const projects = await getAllProjects();
  const key = projects.map((p) => p.name).join("|");
  if (!cache || cache.key !== key) {
    const readmes = await Promise.all(projects.map((p) => getReadmeSnippet(p.repo)));
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: projects.map((p, i) => projectText(p, readmes[i])),
    });
    cache = { key, projects, vectors: emb.data.map((d) => normalize(d.embedding)) };
  }
  return cache;
}

function toHit(p: Project, score: number): SearchHit {
  return {
    name: p.name,
    blurb: p.blurb,
    emoji: p.emoji,
    repo: p.repo,
    demo: p.demo,
    categories: p.categories,
    domains: p.domains,
    score: Number(score.toFixed(3)),
  };
}

export async function searchProjects(query: string, topN = 8): Promise<SearchHit[]> {
  const openai = new OpenAI();
  const { projects, vectors } = await ensureCache(openai);

  const q = await openai.embeddings.create({ model: "text-embedding-3-small", input: query });
  const qv = normalize(q.data[0].embedding);

  return projects
    .map((p, i) => ({ p, score: dot(qv, vectors[i]) }))
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ p, score }) => toHit(p, score));
}

// Projects most similar to a given one (by name), excluding itself. No query
// embedding needed, it reuses the cached project vectors.
export async function relatedProjects(name: string, k = 3): Promise<SearchHit[]> {
  const openai = new OpenAI();
  const { projects, vectors } = await ensureCache(openai);
  const idx = projects.findIndex((p) => p.name === name);
  if (idx < 0) return [];
  const base = vectors[idx];
  return projects
    .map((p, i) => ({ p, score: i === idx ? -1 : dot(base, vectors[i]) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ p, score }) => toHit(p, score));
}
