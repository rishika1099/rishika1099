// Tiny self-hosted analytics: aggregate visit counters + the chatbot question
// log, stored in Netlify Blobs. No cookies, no IPs, no third-party service,
// only aggregate counts (per day / page / country / city) are kept.

import { blobsEnabled, store } from "@/lib/blobs";

export interface VisitStats {
  total: number;
  byDay: Record<string, number>;
  byPath: Record<string, number>;
  byCountry: Record<string, number>;
  byCity: Record<string, number>;
  updatedAt?: string;
}

export interface LoggedQuestion {
  q: string;
  at: string; // ISO timestamp
}

const EMPTY: VisitStats = { total: 0, byDay: {}, byPath: {}, byCountry: {}, byCity: {} };

// Dev fallback: keep counts in memory so localhost works without Blobs.
const mem: { visits: VisitStats; questions: LoggedQuestion[] } = {
  visits: structuredClone(EMPTY),
  questions: [],
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  if (!blobsEnabled()) return key === "visits" ? (mem.visits as T) : (mem.questions as T);
  try {
    const s = await store("analytics");
    const raw = await s.get(key, { type: "json" });
    return (raw as T) ?? fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  if (!blobsEnabled()) {
    if (key === "visits") mem.visits = value as VisitStats;
    else mem.questions = value as LoggedQuestion[];
    return;
  }
  const s = await store("analytics");
  await s.setJSON(key, value);
}

const bump = (rec: Record<string, number>, k: string) => {
  rec[k] = (rec[k] ?? 0) + 1;
};

export async function recordVisit(v: { path: string; country?: string; city?: string }) {
  const stats = await readJson<VisitStats>("visits", structuredClone(EMPTY));
  stats.total += 1;
  bump(stats.byDay, new Date().toISOString().slice(0, 10));
  bump(stats.byPath, v.path || "/");
  if (v.country) bump(stats.byCountry, v.country);
  if (v.city) bump(stats.byCity, v.city);
  stats.updatedAt = new Date().toISOString();
  await writeJson("visits", stats);
}

export async function recordQuestion(q: string) {
  const list = await readJson<LoggedQuestion[]>("questions", []);
  list.push({ q: q.slice(0, 300), at: new Date().toISOString() });
  // keep the log bounded
  await writeJson("questions", list.slice(-500));
}

export async function readStats() {
  const [visits, questions] = await Promise.all([
    readJson<VisitStats>("visits", structuredClone(EMPTY)),
    readJson<LoggedQuestion[]>("questions", []),
  ]);
  return { visits, questions: questions.slice().reverse() };
}

/**
 * Netlify puts the visitor's geo in the `x-nf-geo` header (base64-encoded JSON
 * with city + country). Parse defensively: plain JSON, then base64 JSON.
 */
export function geoFromHeaders(headers: Headers): { country?: string; city?: string } {
  const raw = headers.get("x-nf-geo");
  if (!raw) return {};
  for (const candidate of [raw, tryB64(raw)]) {
    if (!candidate) continue;
    try {
      const g = JSON.parse(candidate) as {
        city?: string;
        country?: { code?: string; name?: string };
      };
      const country = g.country?.name || g.country?.code;
      const city = g.city && country ? `${g.city}, ${g.country?.code ?? country}` : g.city;
      return { country: country || undefined, city: city || undefined };
    } catch {
      // try the next decoding
    }
  }
  return {};
}

function tryB64(s: string): string | null {
  try {
    return Buffer.from(s, "base64").toString("utf8");
  } catch {
    return null;
  }
}
