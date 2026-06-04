// Pull Rishika's Substack posts into the chatbot's knowledge base so it can
// speak to her technical writing in depth. Public RSS, cached for a day.

import type { Doc } from "@/lib/content";
import { categorize, detectDomains } from "@/lib/github-projects";
import { classifyTexts } from "@/lib/classify";

const FEED = "https://rishika1099.substack.com/feed";

export interface WritingChunk {
  id: string;
  title: string;
  href: string;
  text: string;
}

function stripTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function htmlToText(html: string, maxChars = 2600): string {
  const text = html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxChars ? text.slice(0, maxChars) + "…" : text;
}

export async function getSubstackChunks(): Promise<WritingChunk[]> {
  try {
    const res = await fetch(FEED, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    return items
      .map((item, i) => {
        const title = stripTag(item, "title");
        const href = stripTag(item, "link");
        const body = stripTag(item, "content:encoded") || stripTag(item, "description");
        const text = htmlToText(body);
        if (!title || !text) return null;
        return {
          id: `writing:${i}`,
          title,
          href,
          text: `${title}. ${text}`,
        } as WritingChunk;
      })
      .filter((c): c is WritingChunk => c !== null);
  } catch {
    return [];
  }
}

// Substack posts shaped as blog Docs, so new posts show up on the Technical
// Blogs page automatically (cached hourly).
export async function getSubstackPosts(): Promise<Doc[]> {
  try {
    const res = await fetch(FEED, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];

    const parsed = items
      .map((item, i) => {
        const title = stripTag(item, "title");
        const link = stripTag(item, "link");
        const pub = stripTag(item, "pubDate");
        const body = stripTag(item, "content:encoded") || stripTag(item, "description");
        const excerpt = htmlToText(body, 160);
        if (!title || !link) return null;
        // store ISO (YYYY-MM-DD) like the local posts; the page formats it
        const d = pub ? new Date(pub) : null;
        const date = d && !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "";
        // text the classifier sees: the title twice (it's the strongest topic
        // signal) plus a short excerpt. A longer body sample drifts toward
        // generic or incidental topics.
        const sample = `${title}. ${title}. ${excerpt}`;
        return { slug: `substack-${i}`, title, date, excerpt, link, sample };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    // Tag every post by embedding zero-shot classification (one batched call),
    // falling back to the keyword classifier if OpenAI is unavailable.
    const tags = await tagPosts(parsed.map((p) => p.sample));

    return parsed.map((p, i) => {
      const { category, domains } = tags[i];
      return {
        slug: p.slug,
        title: p.title,
        date: p.date,
        excerpt: p.excerpt,
        content: "",
        external: p.link,
        domains,
        // skip the tech chip when it just repeats a domain (e.g. Cybersecurity)
        tech: domains.some((dm) => dm === (category as string)) ? [] : [category],
      } as Doc;
    });
  } catch {
    return [];
  }
}

async function tagPosts(samples: string[]) {
  try {
    return await classifyTexts(samples);
  } catch {
    // embeddings unavailable: degrade to the keyword classifier
    return samples.map((s) => ({ category: categorize(s), domains: detectDomains(s) }));
  }
}
