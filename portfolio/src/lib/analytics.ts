// Tiny self-hosted analytics: aggregate counters + the chatbot question log,
// stored in Netlify Blobs. No cookies, no IPs, no third-party service, only
// aggregate, non-identifying counts (per day / page / country / device /
// referrer / event / web-vital averages). Nothing here needs a consent banner.

import { blobsEnabled, store } from "@/lib/blobs";

export interface VisitStats {
  total: number;
  newVisitors: number;
  returningVisitors: number;
  byDay: Record<string, number>;
  byPath: Record<string, number>;
  byCountry: Record<string, number>;
  byCity: Record<string, number>;
  byReferrer: Record<string, number>;
  byDevice: Record<string, number>;
  byBrowser: Record<string, number>;
  byOS: Record<string, number>;
  events: Record<string, number>; // clicks, downloads, conversions, searches…
  vitals: Record<string, { sum: number; n: number }>; // Core Web Vitals, averaged
  updatedAt?: string;
}

export interface LoggedQuestion {
  q: string;
  at: string; // ISO timestamp
}

const EMPTY: VisitStats = {
  total: 0,
  newVisitors: 0,
  returningVisitors: 0,
  byDay: {},
  byPath: {},
  byCountry: {},
  byCity: {},
  byReferrer: {},
  byDevice: {},
  byBrowser: {},
  byOS: {},
  events: {},
  vitals: {},
};

// fill in any fields missing from older stored data
function normalize(s: Partial<VisitStats> | null): VisitStats {
  return { ...structuredClone(EMPTY), ...(s ?? {}) };
}

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

const bump = (rec: Record<string, number>, k: string, by = 1) => {
  rec[k] = (rec[k] ?? 0) + by;
};

export interface VisitInput {
  path: string;
  country?: string;
  city?: string;
  referrer?: string;
  device?: string;
  browser?: string;
  os?: string;
  visitor?: "new" | "returning";
}

export async function recordVisit(v: VisitInput) {
  const stats = normalize(await readJson<VisitStats>("visits", structuredClone(EMPTY)));
  stats.total += 1;
  if (v.visitor === "new") stats.newVisitors += 1;
  else if (v.visitor === "returning") stats.returningVisitors += 1;
  bump(stats.byDay, new Date().toISOString().slice(0, 10));
  bump(stats.byPath, v.path || "/");
  if (v.country) bump(stats.byCountry, v.country);
  if (v.city) bump(stats.byCity, v.city);
  if (v.referrer) bump(stats.byReferrer, v.referrer);
  if (v.device) bump(stats.byDevice, v.device);
  if (v.browser) bump(stats.byBrowser, v.browser);
  if (v.os) bump(stats.byOS, v.os);
  stats.updatedAt = new Date().toISOString();
  await writeJson("visits", stats);
}

/** A named click / download / conversion / search event. */
export async function recordEvent(name: string) {
  const stats = normalize(await readJson<VisitStats>("visits", structuredClone(EMPTY)));
  bump(stats.events, name.slice(0, 60));
  stats.updatedAt = new Date().toISOString();
  await writeJson("visits", stats);
}

/** A Core Web Vital sample (LCP/CLS/INP/TTFB/FCP), accumulated for averaging. */
export async function recordVital(name: string, value: number) {
  const stats = normalize(await readJson<VisitStats>("visits", structuredClone(EMPTY)));
  const key = name.slice(0, 12).toUpperCase();
  const cur = stats.vitals[key] ?? { sum: 0, n: 0 };
  stats.vitals[key] = { sum: cur.sum + value, n: cur.n + 1 };
  stats.updatedAt = new Date().toISOString();
  await writeJson("visits", stats);
}

/** Wipe all analytics (visits + question log) back to zero. */
export async function clearStats() {
  await Promise.all([writeJson("visits", structuredClone(EMPTY)), writeJson("questions", [])]);
}

export async function recordQuestion(q: string) {
  const list = await readJson<LoggedQuestion[]>("questions", []);
  list.push({ q: q.slice(0, 300), at: new Date().toISOString() });
  await writeJson("questions", list.slice(-500));
}

export async function readStats() {
  const [visits, questions] = await Promise.all([
    readJson<VisitStats>("visits", structuredClone(EMPTY)),
    readJson<LoggedQuestion[]>("questions", []),
  ]);
  return { visits: normalize(visits), questions: questions.slice().reverse() };
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

/** Rough, non-identifying device / browser / OS from the user-agent string. */
export function parseUA(ua: string): { device: string; browser: string; os: string } {
  const u = ua || "";
  const device = /iPad|Tablet/i.test(u)
    ? "tablet"
    : /Mobi|Android|iPhone|iPod/i.test(u)
      ? "mobile"
      : "desktop";
  const browser = /Edg\//i.test(u)
    ? "Edge"
    : /OPR\/|Opera/i.test(u)
      ? "Opera"
      : /Firefox\//i.test(u)
        ? "Firefox"
        : /Chrome\//i.test(u)
          ? "Chrome"
          : /Safari\//i.test(u)
            ? "Safari"
            : "Other";
  const os = /Windows/i.test(u)
    ? "Windows"
    : /iPhone|iPad|iPod/i.test(u)
      ? "iOS"
      : /Mac OS X|Macintosh/i.test(u)
        ? "macOS"
        : /Android/i.test(u)
          ? "Android"
          : /Linux/i.test(u)
            ? "Linux"
            : "Other";
  return { device, browser, os };
}

/** Reduce a referrer URL to a hostname, dropping same-origin and blanks. */
export function refHost(referrer: string | undefined, selfHost: string): string | null {
  if (!referrer) return null;
  try {
    const h = new URL(referrer).hostname.replace(/^www\./, "");
    if (!h || h === selfHost.replace(/^www\./, "")) return null;
    return h;
  } catch {
    return null;
  }
}
