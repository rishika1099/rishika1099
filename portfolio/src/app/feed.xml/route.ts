import { getBlogPosts } from "@/lib/content";
import { SITE_URL } from "@/lib/siteUrl";

export const runtime = "nodejs";
export const revalidate = 3600; // rebuild the feed at most hourly

const SITE = SITE_URL;

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export async function GET() {
  const posts = getBlogPosts();
  const items = posts
    .map((p) => {
      const link = p.external ?? `${SITE}/blog/technical/${p.slug}`;
      const date = p.date ? new Date(`${p.date}T12:00:00Z`).toUTCString() : new Date().toUTCString();
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="false">${esc(link)}</guid>
      <pubDate>${date}</pubDate>
      <description>${esc(p.excerpt || "")}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Rishika Mamidibathula — Writing</title>
    <link>${SITE}/blog/technical</link>
    <description>Technical writing, notes, and deep-dives from Rishika's portfolio.</description>
    <language>en-us</language>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
