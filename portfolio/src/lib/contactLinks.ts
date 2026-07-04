// The four contact cards, editable in /contact/edit. Defaults live here;
// overrides in Blobs (gitignored local file in dev).

import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";

export interface ContactLink {
  icon: string;
  label: string;
  value: string;
  href: string;
}

export const defaultLinks: ContactLink[] = [
  { icon: "📧", label: "Email", value: "rm4318@columbia.edu", href: "mailto:rm4318@columbia.edu" },
  { icon: "💼", label: "LinkedIn", value: "in/rishika-mamidibathula", href: "https://linkedin.com/in/rishika-mamidibathula" },
  { icon: "🐙", label: "GitHub", value: "github.com/rishika1099", href: "https://github.com/rishika1099" },
  { icon: "📰", label: "Substack", value: "rishika1099.substack.com", href: "https://rishika1099.substack.com" },
];

const KEY = "links";
const LOCAL_FILE = path.join(process.cwd(), "src/content/contact-links.json");

export async function getContactLinks(): Promise<ContactLink[]> {
  try {
    let raw: string | null = null;
    if (blobsEnabled()) {
      const s = await store("contact");
      raw = (await s.get(KEY, { type: "text" })) ?? null;
    } else if (fs.existsSync(LOCAL_FILE)) {
      raw = fs.readFileSync(LOCAL_FILE, "utf8");
    }
    if (raw) {
      const parsed = JSON.parse(raw) as ContactLink[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    // fall through
  }
  return defaultLinks;
}

export async function saveContactLinks(links: ContactLink[]): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("contact");
    await s.setJSON(KEY, links);
  } else {
    fs.mkdirSync(path.dirname(LOCAL_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(links, null, 2));
  }
}

export async function clearContactLinks(): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("contact");
    await s.delete(KEY);
  } else if (fs.existsSync(LOCAL_FILE)) {
    fs.unlinkSync(LOCAL_FILE);
  }
}
