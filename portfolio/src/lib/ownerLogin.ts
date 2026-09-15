// The one-time codes behind the owner login.
//
// A right key creates a challenge: a random id, and a six-digit code that is
// emailed to her and stored only as a keyed hash. The code lasts ten minutes,
// allows five tries, and works once. The id travels back to the browser; the
// code only ever travels through her inbox.

import fs from "node:fs";
import path from "node:path";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { blobsEnabled } from "@/lib/blobs";
import type { Scope } from "@/lib/adminAuth";

const CODE_MINUTES = 10;
const MAX_TRIES = 5;

interface Challenge {
  hash: string;
  scopes: Scope[];
  expires: number;
  tries: number;
}

const LOCAL_FILE = path.join(process.cwd(), "src/content/owner-login.json");

async function blobStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore({ name: "owner-login", consistency: "strong" });
}

function readLocal(): Record<string, Challenge> {
  try {
    return fs.existsSync(LOCAL_FILE) ? JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8")) : {};
  } catch {
    return {};
  }
}

async function load(id: string): Promise<Challenge | null> {
  if (blobsEnabled()) return ((await (await blobStore()).get(id, { type: "json" })) as Challenge | null) ?? null;
  return readLocal()[id] ?? null;
}

async function save(id: string, c: Challenge) {
  if (blobsEnabled()) return void (await (await blobStore()).setJSON(id, c));
  const all = readLocal();
  all[id] = c;
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(all, null, 2));
}

async function remove(id: string) {
  if (blobsEnabled()) return void (await (await blobStore()).delete(id));
  const all = readLocal();
  delete all[id];
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(all, null, 2));
}

const hashOf = (id: string, code: string) =>
  createHash("sha256")
    .update(`${process.env.SESSION_SECRET ?? "local"}|owner-code|${id}|${code}`)
    .digest("hex");

/** Old challenges nobody finished, cleared out whenever a new one is made. */
async function sweep() {
  const now = Date.now();
  try {
    if (blobsEnabled()) {
      const s = await blobStore();
      const { blobs } = await s.list();
      for (const b of blobs) {
        const c = (await s.get(b.key, { type: "json" })) as Challenge | null;
        if (!c || c.expires < now) await s.delete(b.key);
      }
    } else {
      const all = readLocal();
      for (const [id, c] of Object.entries(all)) if (c.expires < now) delete all[id];
      fs.writeFileSync(LOCAL_FILE, JSON.stringify(all, null, 2));
    }
  } catch {
    // a missed sweep only leaves a few stale, useless records
  }
}

export async function createChallenge(scopes: Scope[]): Promise<{ id: string; code: string; minutes: number }> {
  await sweep();
  const id = randomBytes(18).toString("base64url");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await save(id, { hash: hashOf(id, code), scopes, expires: Date.now() + CODE_MINUTES * 60_000, tries: 0 });
  return { id, code, minutes: CODE_MINUTES };
}

export type CheckResult =
  | { ok: true; scopes: Scope[] }
  | { ok: false; reason: "wrong"; triesLeft: number }
  | { ok: false; reason: "expired" | "used-up" };

export async function checkChallenge(id: string, code: string): Promise<CheckResult> {
  if (!/^[A-Za-z0-9_-]{10,60}$/.test(id)) return { ok: false, reason: "expired" };
  const c = await load(id);
  if (!c || c.expires < Date.now()) {
    if (c) await remove(id);
    return { ok: false, reason: "expired" };
  }
  const given = Buffer.from(hashOf(id, code.replace(/\s+/g, "")));
  const want = Buffer.from(c.hash);
  if (given.length === want.length && timingSafeEqual(given, want)) {
    // single use
    await remove(id);
    return { ok: true, scopes: c.scopes };
  }
  c.tries += 1;
  if (c.tries >= MAX_TRIES) {
    await remove(id);
    return { ok: false, reason: "used-up" };
  }
  await save(id, c);
  return { ok: false, reason: "wrong", triesLeft: MAX_TRIES - c.tries };
}
