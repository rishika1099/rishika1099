import OpenAI from "openai";
import { getAllProjects } from "@/lib/github-projects";
import { getReadmeSnippet } from "@/lib/github-readme";
import { richToText } from "@/lib/richHtml";
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
  return [p.name, richToText(p.blurb), ...(p.categories ?? []), ...(p.domains ?? []), ...(p.tags ?? []), readme]
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

export interface GalaxyYou {
  x: number; // 0..1, in the same frame as the project points
  y: number;
  query: string;
  nearest: string; // name of the closest project by cosine
  nearestEmoji: string;
  score: number; // cosine similarity to the nearest project, 0..1
}

export interface GalaxyData {
  points: GalaxyPoint[];
  areas: string[]; // distinct technical areas present, for the legend
  you?: GalaxyYou; // present only when the map was queried with an interest
}

interface PcaModel {
  coords: [number, number][];
  // Place a brand-new vector into the same normalized 2D frame as the training
  // points, so a query star lands where it truly belongs. null when degenerate.
  place: ((q: number[]) => [number, number]) | null;
}

// Classical PCA via the small n×n Gram matrix (n projects, d=1536 dims).
// Deterministic init so the layout is stable across requests. Also exposes a
// `place()` to project an out-of-sample query into the same axes.
function pcaModel(vectors: number[][]): PcaModel {
  const n = vectors.length;
  const d = vectors[0]?.length ?? 0;
  if (n < 2) return { coords: vectors.map(() => [0.5, 0.5] as [number, number]), place: null };

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
  // raw PC scores for the training points: score_i = u_k[i] * sqrt(lambda_k)
  const rawX = e1.vec.map((vi) => vi * sx);
  const rawY = e2.vec.map((vi) => vi * sy);

  // min-max normalize each axis into [0.06, 0.94] for a padded, well-filled plot
  const makeAxis = (vals: number[]) => {
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const span = hi - lo || 1;
    return (x: number) => 0.06 + ((x - lo) / span) * 0.88;
  };
  const normX = makeAxis(rawX);
  const normY = makeAxis(rawY);
  const coords: [number, number][] = rawX.map((_, i) => [normX(rawX[i]), normY(rawY[i])]);

  // Out-of-sample projection. For query q, its PC-k score is
  //   s_k = (u_k · c) / sqrt(lambda_k),  where c_i = X[i] · (q - mean).
  // (For a training point this reduces exactly to its coord above.)
  const place = (q: number[]): [number, number] => {
    const qc = q.map((x, j) => x - mean[j]);
    const c = X.map((row) => {
      let s = 0;
      for (let j = 0; j < d; j++) s += row[j] * qc[j];
      return s;
    });
    const scoreAlong = (u: number[], lambda: number) => {
      if (lambda <= 0) return 0;
      let s = 0;
      for (let i = 0; i < n; i++) s += u[i] * c[i];
      return s / Math.sqrt(lambda);
    };
    const clamp = (v: number) => Math.max(0.02, Math.min(0.98, v));
    return [clamp(normX(scoreAlong(e1.vec, e1.val))), clamp(normY(scoreAlong(e2.vec, e2.val)))];
  };

  return { coords, place };
}

export function pca2d(vectors: number[][]): [number, number][] {
  return pcaModel(vectors).coords;
}

// 2D map of every project from its embedding (PCA), colored by its real
// technical area so nothing is mislabeled by fuzzy clustering. When `query` is
// given, its embedding is projected into the same frame as a "you are here"
// star, with the single nearest project (by cosine) called out.
export async function projectMap(query?: string): Promise<GalaxyData> {
  const openai = new OpenAI();
  const { projects, vectors } = await ensureCache(openai);
  const model = pcaModel(vectors);
  const coords = model.coords;

  const points: GalaxyPoint[] = projects.map((p, i) => ({
    name: p.name,
    emoji: p.emoji,
    category: p.categories[0] ?? "Machine Learning",
    domains: p.domains ?? [],
    repo: p.repo,
    demo: p.demo,
    x: coords[i]?.[0] ?? 0.5,
    y: coords[i]?.[1] ?? 0.5,
  }));

  const areas = Array.from(new Set(points.map((p) => p.category)));
  const data: GalaxyData = { points, areas };

  const q = query?.trim();
  if (q && q.length >= 2 && model.place) {
    const emb = await openai.embeddings.create({ model: "text-embedding-3-small", input: q });
    const qv = normalize(emb.data[0].embedding); // PCA ran on normalized vectors
    const [x, y] = model.place(qv);
    // nearest project by cosine, so the callout matches the visual proximity
    let best = -1;
    let bi = -1;
    for (let i = 0; i < vectors.length; i++) {
      const s = dot(qv, vectors[i]);
      if (s > best) {
        best = s;
        bi = i;
      }
    }
    if (bi >= 0) {
      data.you = {
        x,
        y,
        query: q,
        nearest: projects[bi].name,
        nearestEmoji: projects[bi].emoji,
        score: Number(best.toFixed(3)),
      };
    }
  }

  return data;
}
