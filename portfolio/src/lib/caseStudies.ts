// Deep-dive case studies for flagship projects: problem -> architecture ->
// evaluation -> results. Keyed by a project's repo slug, stored as sanitized
// rich HTML (+ a headline metrics strip) in Netlify Blobs, a gitignored local
// folder in dev. Edited from the atelier; rendered at /work/<slug>.

import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";
import { sanitizeRichHtml } from "@/lib/richHtml";

export interface CaseMetric {
  label: string;
  value: string;
}

export interface CaseStudy {
  slug: string; // the project's repo slug (lowercased)
  tagline: string; // one line under the title
  metrics: CaseMetric[]; // headline numbers strip
  body: string; // sanitized ink-editor HTML
}

const LOCAL_DIR = path.join(process.cwd(), "src/content/case-studies");
const STORE = "case-studies";

export async function listCaseStudies(): Promise<CaseStudy[]> {
  try {
    if (blobsEnabled()) {
      const s = await store(STORE);
      const { blobs } = await s.list();
      const all = await Promise.all(
        blobs.map(async (b) => (await s.get(b.key, { type: "json" })) as CaseStudy | null),
      );
      return all.filter((c): c is CaseStudy => !!c?.slug);
    }
    if (!fs.existsSync(LOCAL_DIR)) return [];
    return fs
      .readdirSync(LOCAL_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => JSON.parse(fs.readFileSync(path.join(LOCAL_DIR, f), "utf8")) as CaseStudy);
  } catch {
    return [];
  }
}

export async function listCaseStudySlugs(): Promise<string[]> {
  return (await listCaseStudies()).filter(hasContent).map((c) => c.slug);
}

export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  const clean = slug.toLowerCase();
  try {
    if (blobsEnabled()) {
      const s = await store(STORE);
      return ((await s.get(clean, { type: "json" })) as CaseStudy) ?? null;
    }
    const f = path.join(LOCAL_DIR, `${clean}.json`);
    return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf8")) as CaseStudy) : null;
  } catch {
    return null;
  }
}

/** Has a real write-up worth linking to (not just an empty shell). */
export function hasContent(c: Pick<CaseStudy, "body" | "tagline" | "metrics">): boolean {
  const bodyText = c.body.replace(/<[^>]+>/g, "").trim();
  return bodyText.length > 40 || c.metrics.length > 0 || c.tagline.trim().length > 0;
}

export async function saveCaseStudy(input: {
  slug: string;
  tagline?: string;
  metrics?: CaseMetric[];
  body?: string;
}): Promise<void> {
  const slug = input.slug.toLowerCase().trim();
  if (!slug) throw new Error("slug required");
  const metrics = (input.metrics ?? [])
    .filter((m) => m && (m.label?.trim() || m.value?.trim()))
    .map((m) => ({ label: (m.label ?? "").trim().slice(0, 60), value: (m.value ?? "").trim().slice(0, 40) }))
    .slice(0, 8);
  const cs: CaseStudy = {
    slug,
    tagline: (input.tagline ?? "").trim().slice(0, 240),
    metrics,
    body: sanitizeRichHtml(input.body ?? ""),
  };
  if (blobsEnabled()) {
    const s = await store(STORE);
    await s.setJSON(slug, cs);
  } else {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_DIR, `${slug}.json`), JSON.stringify(cs, null, 2));
  }
}

export async function deleteCaseStudy(slug: string): Promise<void> {
  const clean = slug.toLowerCase();
  if (blobsEnabled()) {
    const s = await store(STORE);
    await s.delete(clean);
  } else {
    const f = path.join(LOCAL_DIR, `${clean}.json`);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}
