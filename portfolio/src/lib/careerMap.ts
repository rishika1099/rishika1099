// Career trajectory mini-galaxy: every study/work/research entry embedded and
// projected to 2D with the same hand-rolled PCA as the project galaxy, then
// connected chronologically, so the drift from software -> ML -> LLM research
// is visible as an actual path through embedding space.

import OpenAI from "openai";
import { education, timeline, type Entry } from "@/data/about";
import { pca2d } from "@/lib/search";

export interface CareerPoint {
  icon: string;
  short: string; // compact label under the icon
  title: string;
  when: string;
  x: number; // 0..1
  y: number; // 0..1
}

// Rough chronological value from the free-text `when` (first year + month hint).
function startVal(when: string): number {
  const year = Number(when.match(/\d{4}/)?.[0] ?? 0);
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const lower = when.toLowerCase();
  const m = months.findIndex((mo) => lower.startsWith(mo));
  if (m >= 0) return year + m / 12;
  if (lower.includes("summer")) return year + 0.5;
  return year;
}

function shortLabel(place: string): string {
  if (place.includes("Children")) return "NYC ACS";
  if (place.includes("Irving")) return "CUIMC";
  if (place.includes("GSAS")) return "Columbia GSAS";
  if (place.includes("Shell")) return "Shell";
  if (place.includes("Novartis")) return "Novartis";
  if (place.includes("Saint Louis")) return "SLU";
  if (place.includes("Vellore")) return "VIT";
  if (place.includes("Columbia")) return "Columbia MS";
  return place.split(/[,:]/)[0];
}

let cache: CareerPoint[] | null = null;

export async function careerMap(): Promise<CareerPoint[]> {
  if (cache) return cache;
  const entries: Entry[] = [...education, ...timeline].sort(
    (a, b) => startVal(a.when) - startVal(b.when),
  );
  const openai = new OpenAI();
  const emb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: entries.map((e) => `${e.title} at ${e.place}. ${e.note}`),
  });
  const coords = pca2d(emb.data.map((d) => d.embedding));
  cache = entries.map((e, i) => ({
    icon: e.icon,
    short: shortLabel(e.place),
    title: e.title,
    when: e.when,
    x: coords[i]?.[0] ?? 0.5,
    y: coords[i]?.[1] ?? 0.5,
  }));
  return cache;
}
