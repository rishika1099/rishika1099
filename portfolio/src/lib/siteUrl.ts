// The site's canonical origin, used for OG images, canonical URLs, RSS, the
// sitemap, robots, and JSON-LD. Netlify sets process.env.URL to the site's
// primary domain, so once www.rishika-m.com is the primary domain in Netlify,
// all of those follow it automatically, no code change needed. Set
// NEXT_PUBLIC_SITE_URL to force a specific value. Falls back to the canonical
// domain (and works in local dev).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  "https://rishika-m.com"
).replace(/\/+$/, "");

/** Just the host, e.g. "www.rishika-m.com" (for labels/badges). */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
