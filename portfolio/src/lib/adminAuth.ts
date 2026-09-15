// Who may use the private rooms: the atelier and edit rooms ("admin") and the
// stats room ("stats").
//
// On the live site a key is not enough. Typing the right key emails a one-time
// code to her, and only the code opens a session: a signed, httpOnly cookie
// that lasts a day. Someone who learns the key still cannot get in without her
// inbox. On her own machine the key alone still works, as it always has, since
// nothing there is reachable by anyone else.
//
// Scheduled jobs (the weekly backup) cannot read an inbox, so they carry
// ADMIN_API_TOKEN instead: a long random token that is never typed and never
// sits in a browser. Without that variable set, no token is accepted.

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { onLiveSite } from "@/lib/rateLimit";
import { SITE_URL } from "@/lib/siteUrl";

export type Scope = "admin" | "stats";

// The __Host- prefix makes the browser refuse the cookie unless it is Secure,
// set for "/" and tied to this exact host, so no other subdomain can plant or
// read one.
export const SESSION_COOKIE = "__Host-owner";
export const SESSION_HOURS = 24;

/** "live" on the deployed site; ADMIN_AUTH=live tries the full flow locally. */
export function authMode(): "local" | "live" {
  return onLiveSite() || process.env.ADMIN_AUTH === "live" ? "live" : "local";
}

export function adminConfigured(): boolean {
  return !!process.env.ADMIN_KEY;
}

const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Which rooms a typed key opens: the admin key opens both, the stats key one. */
export function scopesForKey(given: string): Scope[] {
  const admin = process.env.ADMIN_KEY;
  const stats = process.env.STATS_KEY;
  if (given && admin && same(given, admin)) return ["admin", "stats"];
  if (given && stats && same(given, stats)) return ["stats"];
  return [];
}

function signingKey(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  // The keys are folded in, so changing either one signs every session out.
  const keys = createHash("sha256")
    .update(`${process.env.ADMIN_KEY ?? ""}|${process.env.STATS_KEY ?? ""}`)
    .digest("hex");
  return `${secret}|owner-session|${keys}`;
}

const sign = (payload: string, key: string) =>
  createHmac("sha256", key).update(payload).digest("base64url");

/** A session cookie value for these scopes, or null if sessions cannot be signed. */
export function createSession(scopes: Scope[]): string | null {
  const key = signingKey();
  if (!key || !scopes.length) return null;
  const expiry = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = `${scopes.join("+")}.${expiry}.${randomBytes(9).toString("base64url")}`;
  return `${payload}.${sign(payload, key)}`;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  // Strict: the browser never sends it on a request that starts on another
  // site, which is what a forged "save this" request would need.
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_HOURS * 3600,
};

function cookieValue(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i !== -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

/** The scopes of a valid, unexpired session on this request; empty otherwise. */
export function sessionScopes(request: Request): Scope[] {
  const key = signingKey();
  const value = cookieValue(request, SESSION_COOKIE);
  if (!key || !value) return [];
  const cut = value.lastIndexOf(".");
  if (cut === -1) return [];
  const payload = value.slice(0, cut);
  if (!same(value.slice(cut + 1), sign(payload, key))) return [];
  const [scopes, expiry] = payload.split(".");
  if (!(Number(expiry) > Date.now())) return [];
  return scopes.split("+").filter((s): s is Scope => s === "admin" || s === "stats");
}

// A request that changes something and says it came from another site is
// refused, even with a session. SameSite already stops the cookie riding along
// on such a request; this is the second lock on the same door.
function fromAnotherSite(request: Request): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return false;
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let host: string;
  try {
    host = new URL(origin).host;
  } catch {
    return true;
  }
  const ours = [
    request.headers.get("host"),
    request.headers.get("x-forwarded-host"),
    SITE_URL.replace(/^https?:\/\//, ""),
    `www.${SITE_URL.replace(/^https?:\/\//, "")}`,
  ].filter(Boolean);
  return !ours.includes(host);
}

export function hasScope(request: Request, scope: Scope): boolean {
  const token = process.env.ADMIN_API_TOKEN;
  const auth = request.headers.get("authorization");
  if (token && token.length >= 32 && auth?.startsWith("Bearer ") && same(auth.slice(7).trim(), token)) {
    return true;
  }

  if (authMode() === "local") {
    const given = [request.headers.get("x-admin-key"), request.headers.get("x-stats-key")];
    return given.some((g) => !!g && scopesForKey(g).includes(scope));
  }

  if (fromAnotherSite(request)) return false;
  return sessionScopes(request).includes(scope);
}

/** The atelier and the edit rooms. */
export function isAdmin(request: Request): boolean {
  return hasScope(request, "admin");
}
