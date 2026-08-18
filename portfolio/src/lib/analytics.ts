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
  // campaign + context counters (all coarse, stored as independent aggregate
  // tallies, never joined per visitor, so they can't compose into a fingerprint)
  byCampaign: Record<string, number>; // utm_source / ?ref= a link was tagged with
  byRefPath: Record<string, number>; // full referring URL (host + path)
  byEntry: Record<string, number>; // the page a session landed on first
  byLang: Record<string, number>;
  byTimezone: Record<string, number>;
  byViewport: Record<string, number>;
  // engagement, averaged per page
  readDepth: Record<string, { sum: number; n: number }>; // % of the page scrolled
  dwell: Record<string, { sum: number; n: number }>; // engaged seconds (tab visible)
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
  byCampaign: {},
  byRefPath: {},
  byEntry: {},
  byLang: {},
  byTimezone: {},
  byViewport: {},
  readDepth: {},
  dwell: {},
};

// fill in any fields missing from older stored data
function normalize(s: Partial<VisitStats> | null): VisitStats {
  return { ...structuredClone(EMPTY), ...(s ?? {}) };
}

// An anonymous, ephemeral session journey: the ordered pages one visit touched,
// tagged with the (already-collected) city. The id is a throwaway session token,
// not a persistent identifier, so this stays pseudonymous and cookie-free.
export interface Journey {
  id: string;
  city?: string;
  country?: string;
  pages: string[];
  start: string;
  last: string;
}

// Dev fallback: keep data in memory so localhost works without Blobs.
const mem: Record<string, unknown> = {
  visits: structuredClone(EMPTY),
  questions: [],
  journeys: [],
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  if (!blobsEnabled()) return (mem[key] as T) ?? fallback;
  try {
    const s = await store("analytics");
    // strong consistency: these are read-modify-write counters, so a stale read
    // would clobber another request's update (lost city / visit counts)
    const raw = await s.get(key, { type: "json", consistency: "strong" });
    return (raw as T) ?? fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  if (!blobsEnabled()) {
    mem[key] = value;
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
  campaign?: string;
  refPath?: string;
  entry?: string;
  lang?: string;
  timezone?: string;
  viewport?: string;
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
  if (v.campaign) bump(stats.byCampaign, v.campaign);
  if (v.refPath) bump(stats.byRefPath, v.refPath);
  if (v.entry) bump(stats.byEntry, v.entry);
  if (v.lang) bump(stats.byLang, v.lang);
  if (v.timezone) bump(stats.byTimezone, v.timezone);
  if (v.viewport) bump(stats.byViewport, v.viewport);
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

/**
 * How far down a page a visit got and how long it stayed engaged. Averaged per
 * path, so it answers "does anyone finish the tour" without tracking anyone.
 */
export async function recordRead(path: string, depth?: number, seconds?: number) {
  const key = (path || "/").slice(0, 200);
  const stats = normalize(await readJson<VisitStats>("visits", structuredClone(EMPTY)));
  if (typeof depth === "number" && isFinite(depth) && depth > 0) {
    const d = Math.max(0, Math.min(100, Math.round(depth)));
    const cur = stats.readDepth[key] ?? { sum: 0, n: 0 };
    stats.readDepth[key] = { sum: cur.sum + d, n: cur.n + 1 };
  }
  if (typeof seconds === "number" && isFinite(seconds) && seconds > 0) {
    const sec = Math.max(0, Math.min(3600, Math.round(seconds)));
    const cur = stats.dwell[key] ?? { sum: 0, n: 0 };
    stats.dwell[key] = { sum: cur.sum + sec, n: cur.n + 1 };
  }
  stats.updatedAt = new Date().toISOString();
  await writeJson("visits", stats);
}

/** What people typed into on-site search (the phrase only, no visitor tied to it). */
export async function recordSearch(q: string) {
  const list = await readJson<LoggedQuestion[]>("searches", []);
  list.push({ q: q.slice(0, 200), at: new Date().toISOString() });
  await writeJson("searches", list.slice(-500));
}

/** Wipe all analytics (visits + question log + journeys) back to zero. */
export async function clearStats() {
  await Promise.all([
    writeJson("visits", structuredClone(EMPTY)),
    writeJson("questions", []),
    writeJson("journeys", []),
    writeJson("searches", []),
  ]);
}

const JOURNEY_STALE_MS = 6 * 60 * 60 * 1000; // a session id older than this is "new"
const MAX_JOURNEYS = 200;

/** Append a page to an anonymous session's journey (creates it if new). */
export async function recordJourney(
  sid: string,
  path: string,
  geo: { city?: string; country?: string },
) {
  if (!sid) return;
  const list = await readJson<Journey[]>("journeys", []);
  const now = Date.now();
  const j = list.find((x) => x.id === sid && now - new Date(x.last).getTime() < JOURNEY_STALE_MS);
  if (j) {
    if (j.pages[j.pages.length - 1] !== path) j.pages.push(path);
    j.pages = j.pages.slice(-40);
    if (!j.city && geo.city) j.city = geo.city;
    if (!j.country && geo.country) j.country = geo.country;
    j.last = new Date(now).toISOString();
  } else {
    list.push({
      id: sid.slice(0, 40),
      city: geo.city,
      country: geo.country,
      pages: [path],
      start: new Date(now).toISOString(),
      last: new Date(now).toISOString(),
    });
  }
  await writeJson("journeys", list.slice(-MAX_JOURNEYS));
}

/** Recent session journeys, most-recently-active first. */
export async function readJourneys(): Promise<Journey[]> {
  const list = await readJson<Journey[]>("journeys", []);
  return list.slice().sort((a, b) => (a.last < b.last ? 1 : -1));
}

export async function recordQuestion(q: string) {
  const list = await readJson<LoggedQuestion[]>("questions", []);
  list.push({ q: q.slice(0, 300), at: new Date().toISOString() });
  await writeJson("questions", list.slice(-500));
}

export async function readStats() {
  const [visits, questions, searches] = await Promise.all([
    readJson<VisitStats>("visits", structuredClone(EMPTY)),
    readJson<LoggedQuestion[]>("questions", []),
    readJson<LoggedQuestion[]>("searches", []),
  ]);
  return {
    visits: normalize(visits),
    questions: questions.slice().reverse(),
    searches: searches.slice().reverse(),
  };
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
