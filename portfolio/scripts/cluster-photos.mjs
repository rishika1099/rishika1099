/**
 * Cluster the photo gallery by what the photos actually LOOK like.
 *
 * Pipeline:
 *   1. embed each image with CLIP  (Xenova/clip-vit-base-patch32, runs locally)
 *   2. k-means for k = 2..6, pick the k with the best mean silhouette score (the eval)
 *   3. name each cluster from its captions (OpenAI)
 *   4. write public/photos/clusters.json { k, silhouette, scores, labels, assignments, sizes }
 *
 * Run: npm run cluster   (CLIP needs no key; labelling uses OPENAI_API_KEY from .env.local)
 */
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { pipeline, RawImage } from "@huggingface/transformers";

const PHOTOS_DIR = path.join(process.cwd(), "public/photos");
const CAPTIONS_FILE = path.join(PHOTOS_DIR, "captions.json");
const CLUSTERS_FILE = path.join(PHOTOS_DIR, "clusters.json");
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

// ---------- tiny ML helpers (normalized vectors -> euclidean ~ cosine) ----------
function normalize(v) {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}
function dist(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}
function kmeans(X, k, iters = 100, restarts = 10) {
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
function silhouette(X, assign, k) {
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

// ---------- run ----------
const captions = fs.existsSync(CAPTIONS_FILE) ? JSON.parse(fs.readFileSync(CAPTIONS_FILE, "utf8")) : {};
const files = fs.readdirSync(PHOTOS_DIR).filter((f) => IMAGE_RE.test(f)).sort();
if (files.length < 4) {
  console.log("Not enough photos to cluster (need 4+).");
  process.exit(0);
}

console.log(`Loading CLIP and embedding ${files.length} images (first run downloads the model) …`);
const extractor = await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32");
const X = [];
for (const f of files) {
  const image = await RawImage.read(path.join(PHOTOS_DIR, f));
  const out = await extractor(image, { pooling: "mean", normalize: true });
  X.push(normalize(Array.from(out.data)));
  process.stdout.write(".");
}
console.log(`\nEmbedded ${X.length} images (dim ${X[0].length}).`);

const maxK = Math.min(8, Math.floor(files.length / 2));
const scores = [];
const results = [];
for (let k = 2; k <= maxK; k++) {
  const { assign } = kmeans(X, k);
  const sil = silhouette(X, assign, k);
  results.push({ k, sil, assign });
  scores.push({ k, silhouette: Number(sil.toFixed(3)) });
  console.log(`  k=${k}  silhouette=${sil.toFixed(3)}`);
}
const topSil = Math.max(...results.map((r) => r.sil));
// prefer finer (more) clusters when they're nearly as good as the best score
const TOL = 0.025;
const chosen = results.filter((r) => r.sil >= topSil - TOL).sort((a, b) => b.k - a.k)[0];
const bestK = chosen.k, bestAssign = chosen.assign, bestSil = chosen.sil;
console.log(`✓ chose k = ${bestK} (silhouette ${bestSil.toFixed(3)}; top ${topSil.toFixed(3)})`);

const openai = process.env.OPENAI_API_KEY ? new OpenAI() : null;
const labels = {};
for (let c = 0; c < bestK; c++) {
  const caps = files.filter((_, i) => bestAssign[i] === c).map((f) => captions[f]).filter(Boolean);
  if (openai && caps.length) {
    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: "Give a short lowercase theme title (1 to 3 words) for this group of photo captions. Just the title, no quotes, no period." },
        { role: "user", content: caps.join("\n") },
      ],
    });
    labels[c] = res.choices[0].message.content.trim().replace(/^["']|["']$/g, "").toLowerCase();
  } else {
    labels[c] = `cluster ${c + 1}`;
  }
  console.log(`  cluster ${c}: "${labels[c]}" (${bestAssign.filter((a) => a === c).length} photos)`);
}

const assignments = {};
const sizes = new Array(bestK).fill(0);
files.forEach((f, i) => { assignments[f] = bestAssign[i]; sizes[bestAssign[i]]++; });

fs.writeFileSync(
  CLUSTERS_FILE,
  JSON.stringify({ k: bestK, silhouette: Number(bestSil.toFixed(3)), method: "clip-image", scores, labels, sizes, assignments }, null, 2) + "\n",
);
console.log(`✦ wrote ${CLUSTERS_FILE}`);
