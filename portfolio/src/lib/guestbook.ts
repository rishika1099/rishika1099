// A little guestbook: visitors leave a signed note. Each note's mood is tagged
// by an LLM (temperature 0, JSON), the same "LLM as a function" trick used
// elsewhere. Stored in Netlify Blobs on deploy or a gitignored local file.

import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { blobsEnabled, store } from "@/lib/blobs";

export const GUESTBOOK_MOODS = ["sweet", "excited", "curious", "funny", "kind", "proud"] as const;
export type GuestMood = (typeof GUESTBOOK_MOODS)[number];

export const guestMoodStyle: Record<GuestMood, { emoji: string; tint: string }> = {
  sweet: { emoji: "💗", tint: "#f7b7c9" },
  excited: { emoji: "⚡", tint: "#f6d99b" },
  curious: { emoji: "🤔", tint: "#bfe0f0" },
  funny: { emoji: "😄", tint: "#cdeac0" },
  kind: { emoji: "🌸", tint: "#e6d7f5" },
  proud: { emoji: "🌟", tint: "#ffc6a8" },
};

export interface GuestEntry {
  id: string;
  name: string;
  message: string;
  mood?: GuestMood;
  at: string;
  hidden?: boolean;
}

const KEY = "entries";
const LOCAL_FILE = path.join(process.cwd(), "src/content/guestbook.json");

async function readAll(): Promise<GuestEntry[]> {
  try {
    let raw: string | null = null;
    if (blobsEnabled()) {
      const s = await store("guestbook");
      raw = (await s.get(KEY, { type: "text" })) ?? null;
    } else if (fs.existsSync(LOCAL_FILE)) {
      raw = fs.readFileSync(LOCAL_FILE, "utf8");
    }
    const arr = raw ? (JSON.parse(raw) as GuestEntry[]) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function writeAll(list: GuestEntry[]): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("guestbook");
    await s.setJSON(KEY, list);
  } else {
    fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(list, null, 2));
  }
}

async function classifyMood(message: string): Promise<GuestMood | undefined> {
  if (!process.env.OPENAI_API_KEY) return undefined;
  try {
    const res = await new OpenAI().chat.completions.create({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Classify the mood of a short guestbook note into exactly one of: ${GUESTBOOK_MOODS.join(", ")}. Return JSON: {"mood":"..."}.`,
        },
        { role: "user", content: message.slice(0, 400) },
      ],
    });
    const mood = JSON.parse(res.choices[0]?.message?.content ?? "{}").mood;
    return (GUESTBOOK_MOODS as readonly string[]).includes(mood) ? (mood as GuestMood) : undefined;
  } catch {
    return undefined;
  }
}

/** Public list: visible entries, newest first. */
export async function listGuestbook(): Promise<GuestEntry[]> {
  return (await readAll()).filter((e) => !e.hidden).reverse();
}

/** Owner view: every entry (incl. hidden), newest first. */
export async function listGuestbookAll(): Promise<GuestEntry[]> {
  return (await readAll()).slice().reverse();
}

export async function addGuestEntry(nameRaw: string, messageRaw: string): Promise<GuestEntry> {
  const name = nameRaw.trim().slice(0, 40) || "anonymous";
  const message = messageRaw.trim().slice(0, 500);
  const mood = await classifyMood(message);
  const entry: GuestEntry = { id: Date.now().toString(36), name, message, mood, at: new Date().toISOString() };
  const list = await readAll();
  list.push(entry);
  await writeAll(list.slice(-1000));
  return entry;
}

export async function setGuestHidden(id: string, hidden: boolean): Promise<void> {
  const list = await readAll();
  const e = list.find((x) => x.id === id);
  if (e) e.hidden = hidden;
  await writeAll(list);
}

export async function removeGuestEntry(id: string): Promise<void> {
  await writeAll((await readAll()).filter((e) => e.id !== id));
}
