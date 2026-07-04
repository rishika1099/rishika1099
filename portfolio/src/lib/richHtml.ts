// Light sanitizer for rich HTML written in the atelier's ink editor. Only the
// key-holder can save (all writes are ADMIN_KEY-gated), so this is a seatbelt,
// not a bouncer: strip active content, keep formatting.

export function sanitizeRichHtml(html: string): string {
  let s = html.slice(0, 100_000);
  // drop dangerous elements entirely
  s = s.replace(/<\s*(script|style|iframe|object|embed|link|meta|form)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, "");
  s = s.replace(/<\s*(script|style|iframe|object|embed|link|meta|form)[^>]*\/?\s*>/gi, "");
  // drop inline event handlers and javascript: urls
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'>\s]*\2/gi, "");
  return s;
}

/** plain-text view of rich HTML (for excerpts + keyword tagging) */
export function richToText(html: string, max = 400): string {
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max) + "…" : text;
}
