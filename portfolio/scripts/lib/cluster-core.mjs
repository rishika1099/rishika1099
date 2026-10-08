/**
 * The grouping itself, shared by the two things that run it: `npm run cluster`
 * on a folder of photos on this machine, and the scheduled job that regroups
 * the photos uploaded through the site (scripts/regroup-live.mjs).
 *
 *   1. embed each image with CLIP  (Xenova/clip-vit-base-patch32, no key needed)
 *   2. k-means for k = 2..8, scored by mean silhouette
 *   3. take the finest grouping that scores within a hair of the best
 */
import path from "node:path";
import { pipeline, RawImage } from "@huggingface/transformers";

// ---------- tiny ML helpers (normalized vectors -> euclidean ~ cosine) ----------
export function normalize(v) {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}
function dist(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}
export function kmeans(X, k, iters = 100, restarts = 10) {
  let best = null;
  for (let r = 0; r < restarts; r++) {
    const idx = [...Array(X.length).keys()].sort(() => Math.random() - 0.5).slice(0, k);
    let centroids = idx.map((i) => [...X[i]]);
    const assign = new Array(X.length).fill(0);
    for (let it = 0; it < iters; it++) {
      let moved = false;
      for (let i = 0; i < X.length; i++) {
        let bd = Infinity, bc = 0;
        for (let c = 0; c < k; c++) {
          const d = dist(X[i], centroids[c]);
          if (d < bd) { bd = d; bc = c; }
        }
        if (assign[i] !== bc) { assign[i] = bc; moved = true; }
      }
      const sums = Array.from({ length: k }, () => new Array(X[0].length).fill(0));
      const counts = new Array(k).fill(0);
      for (let i = 0; i < X.length; i++) {
        counts[assign[i]]++;
        for (let j = 0; j < X[0].length; j++) sums[assign[i]][j] += X[i][j];
      }
      for (let c = 0; c < k; c++) if (counts[c]) centroids[c] = sums[c].map((s) => s / counts[c]);
      if (!moved && it > 0) break;
    }
    let inertia = 0;
    for (let i = 0; i < X.length; i++) inertia += dist(X[i], centroids[assign[i]]) ** 2;
    if (!best || inertia < best.inertia) best = { assign: [...assign], inertia };
  }
  return best;
}
export function silhouette(X, assign, k) {
  const n = X.length;
  if (k < 2) return 0;
  let total = 0, counted = 0;
  for (let i = 0; i < n; i++) {
    const own = assign[i];
    const intra = []; const inter = Array.from({ length: k }, () => []);
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const d = dist(X[i], X[j]);
      if (assign[j] === own) intra.push(d);
      else inter[assign[j]].push(d);
    }
    const a = intra.length ? intra.reduce((s, x) => s + x, 0) / intra.length : 0;
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === own || !inter[c].length) continue;
      const mean = inter[c].reduce((s, x) => s + x, 0) / inter[c].length;
      if (mean < b) b = mean;
    }
    if (b === Infinity) continue;
    total += intra.length ? (b - a) / Math.max(a, b) : 0;
    counted++;
  }
  return counted ? total / counted : 0;
}


/** Group the named image files in `dir`. `assign[i]` is the group of `files[i]`. */
export async function clusterImages(dir, files, log = console.log) {
  log(`Loading CLIP and embedding ${files.length} images (first run downloads the model) …`);
  const extractor = await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32");
  const X = [];
  for (const f of files) {
    const image = await RawImage.read(path.join(dir, f));
    const out = await extractor(image, { pooling: "mean", normalize: true });
    X.push(normalize(Array.from(out.data)));
    process.stdout.write(".");
  }
  log(`\nEmbedded ${X.length} images (dim ${X[0].length}).`);

  const maxK = Math.min(8, Math.floor(files.length / 2));
  const scores = [];
  const results = [];
  for (let k = 2; k <= maxK; k++) {
    const { assign } = kmeans(X, k);
    const sil = silhouette(X, assign, k);
    results.push({ k, sil, assign });
    scores.push({ k, silhouette: Number(sil.toFixed(3)) });
    log(`  k=${k}  silhouette=${sil.toFixed(3)}`);
  }
  const topSil = Math.max(...results.map((r) => r.sil));
  // prefer finer (more) clusters when they're nearly as good as the best score
  const TOL = 0.025;
  // A group of one is not a group: it reads on the page as a photo that was
  // left over. A grouping with one is passed over whenever another is close.
  const smallest = (r) => Math.min(...Array.from({ length: r.k }, (_, c) => r.assign.filter((x) => x === c).length));
  const near = results.filter((r) => r.sil >= topSil - TOL);
  const whole = near.filter((r) => smallest(r) >= 2);
  const fallback = results.filter((r) => smallest(r) >= 2).sort((a, b) => b.sil - a.sil);
  const chosen = (whole.length ? whole : fallback.length ? fallback.slice(0, 1) : near).sort((a, b) => b.k - a.k)[0];
  log(`✓ chose k = ${chosen.k} (silhouette ${chosen.sil.toFixed(3)}; top ${topSil.toFixed(3)})`);
  return { k: chosen.k, silhouette: Number(chosen.sil.toFixed(3)), scores, assign: chosen.assign };
}
