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

export interface GalaxyPoint {
  name: string;
  emoji: string;
  category: string;
  domains: string[];
  repo: string;
  demo?: string;
  x: number; // 0..1
  y: number; // 0..1
}

// Classical PCA via the small n×n Gram matrix (n projects, d=1536 dims).
// Returns each point's first two principal coordinates. Deterministic init so
// the layout is stable across requests.
function pca2d(vectors: number[][]): [number, number][] {
  const n = vectors.length;
  const d = vectors[0]?.length ?? 0;
  if (n === 0) return [];

  const mean = new Array(d).fill(0);
  for (const v of vectors) for (let j = 0; j < d; j++) mean[j] += v[j];
  for (let j = 0; j < d; j++) mean[j] /= n;
  const X = vectors.map((v) => v.map((x, j) => x - mean[j]));

  // Gram matrix G = X X^T  (n×n)
  const G: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let k = i; k < n; k++) {
      let s = 0;
      for (let j = 0; j < d; j++) s += X[i][j] * X[k][j];
      G[i][k] = s;
      G[k][i] = s;
    }
  }

  function topEigen(M: number[][]) {
    let v = Array.from({ length: n }, (_, i) => Math.sin(i + 1)); // deterministic seed
    const norm0 = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    v = v.map((x) => x / norm0);
    let val = 0;
    for (let it = 0; it < 300; it++) {
      const Mv = M.map((row) => row.reduce((s, mij, j) => s + mij * v[j], 0));
      const nrm = Math.sqrt(Mv.reduce((s, x) => s + x * x, 0)) || 1;
      const nv = Mv.map((x) => x / nrm);
      val = nrm;
      let diff = 0;
      for (let i = 0; i < n; i++) diff += Math.abs(nv[i] - v[i]);
      v = nv;
      if (diff < 1e-8) break;
    }
    return { val, vec: v };
  }

  const e1 = topEigen(G);
  // deflate, then second component
  const G2 = G.map((row, i) => row.map((mij, j) => mij - e1.val * e1.vec[i] * e1.vec[j]));
  const e2 = topEigen(G2);

  const sx = Math.sqrt(Math.max(e1.val, 0));
  const sy = Math.sqrt(Math.max(e2.val, 0));
  const raw: [number, number][] = e1.vec.map((vi, i) => [vi * sx, e2.vec[i] * sy]);

  // min-max normalize each axis into [0.06, 0.94] for padded plotting
  const norm = (vals: number[]) => {
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const span = hi - lo || 1;
    return vals.map((x) => 0.06 + ((x - lo) / span) * 0.88);
  };
  const xs = norm(raw.map((r) => r[0]));
  const ys = norm(raw.map((r) => r[1]));
  return raw.map((_, i) => [xs[i], ys[i]]);
}

// 2D map of every project from its embedding, for the "embeddings galaxy".
export async function projectMap(): Promise<GalaxyPoint[]> {
  const openai = new OpenAI();
  const { projects, vectors } = await ensureCache(openai);
  const coords = pca2d(vectors);
  return projects.map((p, i) => ({
    name: p.name,
    emoji: p.emoji,
    category: p.categories[0] ?? "Machine Learning",
    domains: p.domains ?? [],
    repo: p.repo,
    demo: p.demo,
    x: coords[i]?.[0] ?? 0.5,
    y: coords[i]?.[1] ?? 0.5,
  }));
}
