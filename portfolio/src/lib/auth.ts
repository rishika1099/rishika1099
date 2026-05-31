import crypto from "node:crypto";

export const POEM_COOKIE = "poem_key";
export const ADMIN_COOKIE = "poem_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  // SESSION_SECRET signs the cookie; falls back to the password so the
  // gate still works if only POEMS_PASSWORD is configured.
  return (
    process.env.SESSION_SECRET ||
    process.env.POEMS_PASSWORD ||
    "dev-only-insecure-secret-change-me"
  );
}

function getAdminSecret(): string {
  // The admin token is signed with a key derived from the admin password so
  // viewer tokens can never be replayed as admin tokens.
  return (
    process.env.SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "dev-only-insecure-admin-secret-change-me"
  );
}

function hmac(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function adminHmac(data: string): string {
  return crypto
    .createHmac("sha256", getAdminSecret())
    .update("admin:" + data)
    .digest("base64url");
}

/** Create a signed token of the form `<expiry>.<signature>`. */
export function createToken(): string {
  const expiry = String(Date.now() + MAX_AGE_SECONDS * 1000);
  return `${expiry}.${hmac(expiry)}`;
}

/** Verify a token's signature and expiry in constant time. */
export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiry, sig] = token.split(".");
  if (!expiry || !sig) return false;

  const expected = hmac(expiry);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  return Number(expiry) > Date.now();
}

/** Create a signed admin token of the form `<expiry>.<signature>`. */
export function createAdminToken(): string {
  const expiry = String(Date.now() + MAX_AGE_SECONDS * 1000);
  return `${expiry}.${adminHmac(expiry)}`;
}

/** Verify an admin token's signature and expiry in constant time. */
export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expiry, sig] = token.split(".");
  if (!expiry || !sig) return false;

  const expected = adminHmac(expiry);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  return Number(expiry) > Date.now();
}

function constantTimeEquals(submitted: string, actual: string | undefined): boolean {
  if (!actual) return false;
  const a = Buffer.from(submitted);
  const b = Buffer.from(actual);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Compare the submitted password to the configured viewer one, constant-time. */
export function checkPassword(submitted: string): boolean {
  return constantTimeEquals(submitted, process.env.POEMS_PASSWORD);
}

/** Compare the submitted password to the configured admin one, constant-time. */
export function checkAdminPassword(submitted: string): boolean {
  return constantTimeEquals(submitted, process.env.ADMIN_PASSWORD);
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
