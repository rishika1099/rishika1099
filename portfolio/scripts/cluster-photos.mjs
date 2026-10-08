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
import { clusterImages } from "./lib/cluster-core.mjs";

const PHOTOS_DIR = path.join(process.cwd(), "public/photos");
const CAPTIONS_FILE = path.join(PHOTOS_DIR, "captions.json");
const CLUSTERS_FILE = path.join(PHOTOS_DIR, "clusters.json");
const IMAGE_RE = /\.(jpe?g|png|webp)$/i;

// ---------- run ----------
const captions = fs.existsSync(CAPTIONS_FILE) ? JSON.parse(fs.readFileSync(CAPTIONS_FILE, "utf8")) : {};
const files = fs.readdirSync(PHOTOS_DIR).filter((f) => IMAGE_RE.test(f)).sort();
if (files.length < 4) {
  console.log("Not enough photos to cluster (need 4+).");
  process.exit(0);
}

const { k: bestK, silhouette: bestSil, scores, assign: bestAssign } = await clusterImages(PHOTOS_DIR, files);

const openai = process.env.OPENAI_API_KEY ? new OpenAI() : null;
const labels = {};
for (let c = 0; c < bestK; c++) {
  const caps = files.filter((_, i) => bestAssign[i] === c).map((f) => captions[f]).filter(Boolean);
  if (openai && caps.length) {
    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: "These photo captions belong to one group of look-alike photos. Name what the photos share, as a heading for a photo gallery: one to three lowercase words, concrete and specific (the subject, the place or the light, like: skylines by day, sunsets over water, mountain air). Not a mood: never serene, tranquil, brilliance, embrace, beauty, moments, or anything beginning nature's. Just the name, no quotes, no period." },
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
  JSON.stringify({ k: bestK, silhouette: bestSil, method: "clip-image", scores, labels, sizes, assignments }, null, 2) + "\n",
);
console.log(`✦ wrote ${CLUSTERS_FILE}`);
