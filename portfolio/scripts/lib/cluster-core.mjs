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

  const refined = splitLarge(X, chosen.assign, chosen.k, log);
  const sil = silhouette(X, refined.assign, refined.k);
  if (refined.k !== chosen.k) log(`✓ ${refined.k} groups after splitting the large ones (silhouette ${sil.toFixed(3)})`);
  return { k: refined.k, silhouette: Number(sil.toFixed(3)), scores, assign: refined.assign };
}

/**
 * Break up any group too big to be a theme.
 *
 * Scored over the whole gallery, the best grouping is often a coarse one: a
 * city photographer's gallery comes back as "cityscapes" and everything else,
 * because the difference between a skyline and a mountain swamps the
 * difference between a skyline by day and one at night. Half the gallery under
 * one heading is not a theme a visitor can use.
 *
 * So a group holding more than a fifth of the photos (and more than eight) is
 * grouped again by itself, where those finer differences are the only ones
 * left to find. The pieces must each hold at least three photos, and a group
 * that does not come apart cleanly is left whole.
 */
function splitLarge(X, assign, k, log) {
  const out = [...assign];
  let groups = k;
  const limit = Math.max(8, Math.ceil(X.length / 5));
  const tried = new Set();
  for (let pass = 0; pass < 12; pass++) {
    const sizes = Array.from({ length: groups }, (_, c) => out.filter((a) => a === c).length);
    const big = sizes.map((n, c) => ({ n, c })).filter((g) => g.n > limit && !tried.has(g.c)).sort((a, b) => b.n - a.n)[0];
    if (!big) break;
    const idx = out.map((a, i) => (a === big.c ? i : -1)).filter((i) => i >= 0);
    const sub = idx.map((i) => X[i]);
    let best = null;
    for (let kk = 2; kk <= Math.min(4, Math.floor(sub.length / 3)); kk++) {
      const { assign: a } = kmeans(sub, kk);
      const smallest = Math.min(...Array.from({ length: kk }, (_, c) => a.filter((x) => x === c).length));
      if (smallest < 3) continue;
      const sil = silhouette(sub, a, kk);
      // more pieces when they are nearly as clean as fewer
      if (!best || sil > best.sil - 0.02) best = { kk, sil, a };
    }
    if (!best || best.sil <= 0) {
      tried.add(big.c);
      continue;
    }
    // the first piece keeps the group's number; the others take new ones
    idx.forEach((i, j) => {
      if (best.a[j] > 0) out[i] = groups + best.a[j] - 1;
    });
    log(`  split a group of ${big.n} into ${best.kk} (silhouette within it ${best.sil.toFixed(3)})`);
    groups += best.kk - 1;
  }
  return { assign: out, k: groups };
}
