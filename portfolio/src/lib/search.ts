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
  cluster: number;
}

export interface ClusterMeta {
  id: number;
  label: string;
  size: number;
}

export interface GalaxyData {
  points: GalaxyPoint[];
  clusters: ClusterMeta[];
  k: number;
  silhouette: number;
}

// --- k-means + silhouette on the embeddings (deterministic) ---
function euclid(a: number[], b: number[]): number {
  let s = 0;
  for (let j = 0; j < a.length; j++) {
    const d = a[j] - b[j];
    s += d * d;
  }
  return Math.sqrt(s);
}

function kmeans(V: number[][], k: number, iters = 60): number[] {
  const n = V.length;
  const d = V[0].length;
  // deterministic init: evenly spread starting points
  let centroids = Array.from({ length: k }, (_, c) => V[Math.floor((c * n) / k)].slice());
  const assign = new Array(n).fill(0);
  for (let it = 0; it < iters; it++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bd = Infinity;
      for (let c = 0; c < k; c++) {
        const dd = euclid(V[i], centroids[c]);
        if (dd < bd) {
          bd = dd;
          best = c;
        }
      }
      if (assign[i] !== best) {
        assign[i] = best;
        changed = true;
      }
    }
    const sums = Array.from({ length: k }, () => new Array(d).fill(0));
    const cnt = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      cnt[assign[i]]++;
      const row = sums[assign[i]];
      for (let j = 0; j < d; j++) row[j] += V[i][j];
    }
    centroids = sums.map((row, c) => (cnt[c] ? row.map((x) => x / cnt[c]) : centroids[c]));
    if (!changed && it > 0) break;
  }
  return assign;
}

function silhouette(V: number[][], assign: number[]): number {
  const n = V.length;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const same: number[] = [];
    const others: Record<number, number[]> = {};
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const dij = euclid(V[i], V[j]);
      if (assign[j] === assign[i]) same.push(dij);
      else (others[assign[j]] ??= []).push(dij);
    }
    const a = same.length ? same.reduce((s, x) => s + x, 0) / same.length : 0;
    let b = Infinity;
    for (const c in others) {
      const arr = others[c];
      const m = arr.reduce((s, x) => s + x, 0) / arr.length;
      if (m < b) b = m;
    }
    if (!isFinite(b)) b = 0;
    total += same.length === 0 ? 0 : (b - a) / Math.max(a, b || 1);
  }
  return n ? total / n : 0;
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

// 2D map of every project from its embedding, clustered with k-means (k chosen
// by silhouette) and each cluster labelled by its dominant category.
export async function projectMap(): Promise<GalaxyData> {
  const openai = new OpenAI();
  const { projects, vectors } = await ensureCache(openai);
  const coords = pca2d(vectors);
  const n = projects.length;

  // pick k in [2, 6] by best silhouette
  let bestK = 2;
  let bestAssign: number[] = new Array(n).fill(0);
  let bestSil = -Infinity;
  const maxK = Math.min(6, Math.max(2, Math.floor(n / 3)));
  for (let k = 2; k <= maxK; k++) {
    const assign = kmeans(vectors, k);
    const sil = silhouette(vectors, assign);
    if (sil > bestSil) {
      bestSil = sil;
      bestK = k;
      bestAssign = assign;
    }
  }

  // label each cluster by its most common primary category
  const clusters: ClusterMeta[] = [];
  for (let c = 0; c < bestK; c++) {
    const members = projects.filter((_, i) => bestAssign[i] === c);
    if (members.length === 0) continue;
    const counts: Record<string, number> = {};
    for (const m of members) {
      const cat = m.categories[0] ?? "Machine Learning";
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    const label = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    clusters.push({ id: c, label, size: members.length });
  }

  const points: GalaxyPoint[] = projects.map((p, i) => ({
    name: p.name,
    emoji: p.emoji,
    category: p.categories[0] ?? "Machine Learning",
    domains: p.domains ?? [],
    repo: p.repo,
    demo: p.demo,
    x: coords[i]?.[0] ?? 0.5,
    y: coords[i]?.[1] ?? 0.5,
    cluster: bestAssign[i],
  }));

  return { points, clusters, k: bestK, silhouette: Number(bestSil.toFixed(3)) };
}
