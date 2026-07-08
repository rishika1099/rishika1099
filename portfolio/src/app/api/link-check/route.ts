import { NextResponse } from "next/server";
import { getAllProjects } from "@/lib/github-projects";
import { getContactLinks } from "@/lib/contactLinks";
import { getBlogPosts } from "@/lib/content";

export const runtime = "nodejs";
export const maxDuration = 60;

// "broken" = a link we're confident is dead. "unverified" = a host that blocks
// automated checks (LinkedIn returns 999, some hosts 403/429) or a demo that's
// asleep and timed out. Those aren't necessarily broken, so we surface them
// separately instead of crying wolf.
type State = "ok" | "broken" | "unverified";

interface Result {
  url: string;
  source: string;
  state: State;
  status: number | string;
}

// statuses that mean "the host refused an automated check", not "dead link"
const BOT_BLOCK = new Set([401, 403, 406, 429, 999]);

async function check(url: string, source: string): Promise<Result> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    // try HEAD first, fall back to GET for servers that reject HEAD
    let res = await fetch(url, { method: "HEAD", redirect: "follow", signal: ctrl.signal });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal });
    }
    const status = res.status;
    const state: State = status < 400 ? "ok" : BOT_BLOCK.has(status) ? "unverified" : "broken";
    return { url, source, state, status };
  } catch {
    // timeout / DNS / connection refused: could be a sleeping demo, treat as unverified
    return { url, source, state: "unverified", status: "unreachable" };
  } finally {
    clearTimeout(t);
  }
}

// Private link checker (STATS_KEY): scans the site's outbound links (project
// repos/demos, contact links, blog posts) and reports any that are broken.
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("key") ?? "";
  const expected = process.env.STATS_KEY;
  if (!expected) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (key !== expected) return NextResponse.json({ error: "nope" }, { status: 401 });

  const [projects, contact, posts] = await Promise.all([
    getAllProjects(),
    getContactLinks(),
    Promise.resolve(getBlogPosts()),
  ]);

  const targets: { url: string; source: string }[] = [];
  for (const p of projects) {
    if (p.repo) targets.push({ url: p.repo, source: `project: ${p.name}` });
    if (p.demo) targets.push({ url: p.demo, source: `demo: ${p.name}` });
  }
  for (const l of contact) if (l.href?.startsWith("http")) targets.push({ url: l.href, source: `contact: ${l.label}` });
  for (const b of posts) if (b.external?.startsWith("http")) targets.push({ url: b.external, source: `post: ${b.title}` });

  // dedupe by url
  const seen = new Set<string>();
  const unique = targets.filter((t) => (seen.has(t.url) ? false : (seen.add(t.url), true)));

  const results = await Promise.all(unique.map((t) => check(t.url, t.source)));
  const rank = { broken: 0, unverified: 1, ok: 2 } as const;
  results.sort((a, b) => rank[a.state] - rank[b.state]); // broken first, ok last
  const counts = {
    ok: results.filter((r) => r.state === "ok").length,
    broken: results.filter((r) => r.state === "broken").length,
    unverified: results.filter((r) => r.state === "unverified").length,
  };
  return NextResponse.json({ checkedAt: new Date().toISOString(), total: results.length, counts, results });
}
