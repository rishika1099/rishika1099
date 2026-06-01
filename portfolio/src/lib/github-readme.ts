// Fetches and cleans README files from GitHub so the chatbot (and search) can
// understand each project in depth, not just its one-line description.
// READMEs are public, so this is cache-friendly; set GITHUB_TOKEN to lift the
// unauthenticated 60/hour rate limit on the live site (optional).

function parseRepo(repoUrl: string): { owner: string; repo: string } | null {
  try {
    const parts = new URL(repoUrl).pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

/** Strip markdown noise down to readable prose for embedding. */
function cleanMarkdown(md: string): string {
  return md
    .replace(/<!--[\s\S]*?-->/g, " ") // html comments
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images / badges
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> link text
    .replace(/^#{1,6}\s*/gm, "") // heading markers
    .replace(/[*_>#|`-]{2,}/g, " ") // rules, table pipes, emphasis runs
    .replace(/^\s*[-*+]\s+/gm, "") // list bullets
    .replace(/\s+/g, " ") // collapse whitespace
    .trim();
}

export async function getReadmeSnippet(repoUrl: string, maxChars = 1200): Promise<string> {
  const parsed = parseRepo(repoUrl);
  if (!parsed) return "";

  const headers: Record<string, string> = { Accept: "application/vnd.github.raw+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/readme`,
      { headers, next: { revalidate: 86400 } },
    );
    if (!res.ok) return "";
    const md = await res.text();
    const text = cleanMarkdown(md);
    return text.length > maxChars ? text.slice(0, maxChars) + "…" : text;
  } catch {
    return "";
  }
}
