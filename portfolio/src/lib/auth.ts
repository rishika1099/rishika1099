import crypto from "node:crypto";

export const POEM_COOKIE = "poem_key";
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

function hmac(data: string): string {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
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

/** Compare the submitted password to the configured viewer one, constant-time. */
export function checkPassword(submitted: string): boolean {
  const actual = process.env.POEMS_PASSWORD;
  if (!actual) return false;
  const a = Buffer.from(submitted);
  const b = Buffer.from(actual);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
