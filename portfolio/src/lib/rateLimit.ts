// How many times a visitor may do something in a window of time.
//
// The routes worth limiting are the ones a script could lean on: every chatbot
// answer and posting match is a paid model call and a function run, the poem
// password and the atelier login can be guessed at, and the guestbook can be
// filled. On the free Netlify plan the cost of that is not only money: when the
// month's credits run out the whole site goes dark until they reset.
//
// Counts live in Netlify Blobs with read-your-writes consistency, one small
// record per bucket, reset when its window ends. Two requests landing at the
// same instant can both read the same count, so a burst can slip one or two
// past a limit; the limits are set so that does not matter. Only a salted
// fingerprint of the visitor is kept, never the address itself.
//
// Off on her own machine, where the only visitor is her.

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { blobsEnabled } from "@/lib/blobs";

interface Window {
  start: number;
  counts: Record<string, number>;
}

const LOCAL_FILE = path.join(process.cwd(), "src/content/rate-limits.json");

/** True on the deployed site, whatever environment variables it happens to see. */
export function onLiveSite(): boolean {
  return !!(
    process.env.NETLIFY ||
    process.env.NETLIFY_BLOBS_CONTEXT ||
    process.env.SITE_ID ||
    process.env.AWS_LAMBDA_FUNCTION_NAME
  );
}

const limitsOn = () => onLiveSite() || process.env.RATE_LIMITS === "on";

/** The visitor's address as Netlify reports it, for counting only. */
export function visitorOf(request: Request): string {
  return (
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

const fingerprint = (v: string) =>
  createHash("sha256")
    .update(`${process.env.SESSION_SECRET ?? "local"}|rate|${v.toLowerCase()}`)
    .digest("hex")
    .slice(0, 16);

async function blobStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore({ name: "rate-limits", consistency: "strong" });
}

async function readWindow(bucket: string): Promise<Window | null> {
  try {
    if (blobsEnabled()) {
      return ((await (await blobStore()).get(bucket, { type: "json" })) as Window | null) ?? null;
    }
    if (!fs.existsSync(LOCAL_FILE)) return null;
    const all = JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8")) as Record<string, Window>;
    return all[bucket] ?? null;
  } catch {
    return null;
  }
}

async function writeWindow(bucket: string, w: Window) {
  if (blobsEnabled()) {
    await (await blobStore()).setJSON(bucket, w);
    return;
  }
  let all: Record<string, Window> = {};
  try {
    if (fs.existsSync(LOCAL_FILE)) all = JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8"));
  } catch {
    all = {};
  }
  all[bucket] = w;
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(all, null, 2));
}

/**
 * Count one use of `bucket` by `who`, and say whether it is within `limit` uses
 * per `windowSeconds`. A limit of the whole site, not one visitor, is the same
 * call with a fixed `who` such as "everyone".
 *
 * If the store cannot be reached the request is allowed: a storage hiccup
 * should not take the chatbot down with it.
 */
export async function allow(
  bucket: string,
  who: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  if (!limitsOn()) return true;
  try {
    const now = Date.now();
    let w = await readWindow(bucket);
    if (!w || now - w.start >= windowSeconds * 1000) w = { start: now, counts: {} };
    const id = fingerprint(who);
    const used = w.counts[id] ?? 0;
    if (used >= limit) return false;
    w.counts[id] = used + 1;
    await writeWindow(bucket, w);
    return true;
  } catch {
    return true;
  }
}

/** A visitor limit and a site-wide limit together; both must allow it. */
export async function allowVisitor(
  request: Request,
  bucket: string,
  perVisitor: number,
  overall: number,
  windowSeconds: number,
): Promise<boolean> {
  // the site-wide count is checked second, so a visitor already over their own
  // limit does not use up everyone else's
  if (!(await allow(`${bucket}-visitor`, visitorOf(request), perVisitor, windowSeconds))) return false;
  return allow(`${bucket}-all`, "everyone", overall, windowSeconds);
}
