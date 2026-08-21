// Commit a file straight into the GitHub repo from the server, used to keep the
// resume PDF that the profile README links in step with the one saved in the
// studio. Needs a token with contents:write on the repo. GITHUB_TOKEN_RESUME is
// preferred: a fine-grained PAT scoped to just this repo, so a broader
// GITHUB_TOKEN kept around for other things is never used for these writes.
// Without any token this is a no-op, so the site works exactly as before.

const REPO = process.env.GITHUB_RESUME_REPO || "rishika1099/rishika1099";
const BRANCH = process.env.GITHUB_RESUME_BRANCH || "main";
const API = "https://api.github.com";

export type PushResult =
  | { status: "pushed"; commit?: string }
  | { status: "unchanged" }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

/**
 * Clean up a pasted secret: env values routinely arrive with a trailing
 * newline, wrapping quotes, or an already-included "Bearer " prefix, any of
 * which produce a malformed header and a 401 that looks like a bad token.
 */
function clean(raw: string): string {
  let v = raw.trim();
  if (v.length > 1 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    v = v.slice(1, -1).trim();
  }
  return v.replace(/^Bearer\s+/i, "").trim();
}

/** The token plus which variable it came from, for debuggable errors. */
function token(): { value: string; from: string } | undefined {
  for (const name of ["GITHUB_TOKEN_RESUME", "GITHUB_TOKEN", "GH_TOKEN"]) {
    const raw = process.env[name];
    if (!raw) continue;
    const value = clean(raw);
    if (value) return { value, from: name };
  }
  return undefined;
}

/** Describe a token without revealing it: enough to spot a truncated paste. */
function shape(v: string): string {
  const kind = v.startsWith("github_pat_")
    ? "fine-grained"
    : v.startsWith("ghp_")
      ? "classic"
      : v.startsWith("gho_") || v.startsWith("ghs_")
        ? "oauth/app"
        : "unrecognised prefix";
  const expected = v.startsWith("github_pat_") ? ", expected ~93" : v.startsWith("ghp_") ? ", expected ~40" : "";
  return `${kind}, ${v.length} chars${expected}`;
}

export function githubConfigured(): boolean {
  return !!token();
}

async function gh(path: string, init?: RequestInit) {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()?.value ?? ""}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
}

/**
 * Create or update one file on the default branch. Returns a status rather than
 * throwing: a failed push must never fail the save that triggered it.
 */
export async function pushFileToGitHub(
  path: string,
  content: Buffer,
  message: string,
): Promise<PushResult> {
  const t = token();
  if (!t) return { status: "skipped", reason: "no GitHub token configured" };
  try {
    // the API needs the blob sha of the file being replaced (absent = new file)
    let sha: string | undefined;
    const head = await gh(`/repos/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`);
    if (head.ok) {
      const cur = (await head.json()) as { sha?: string; content?: string };
      sha = cur.sha;
      // identical bytes already on the branch: nothing worth committing
      if (cur.content && Buffer.from(cur.content, "base64").equals(content)) {
        return { status: "unchanged" };
      }
    } else if (head.status === 401 || head.status === 403) {
      return {
        status: "failed",
        reason: `${t.from} was rejected (${head.status}). The stored value is ${shape(t.value)}. Regenerate it, or redeploy if you already updated it.`,
      };
    } else if (head.status !== 404) {
      return { status: "failed", reason: `lookup failed (${head.status})` };
    }

    const res = await gh(`/repos/${REPO}/contents/${encodeURI(path)}`, {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: content.toString("base64"),
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });
    if (!res.ok) {
      const detail = (await res.json().catch(() => ({}))) as { message?: string };
      const hint =
        res.status === 403 || res.status === 404
          ? ` (${t.from} likely lacks Contents write on ${REPO})`
          : "";
      return { status: "failed", reason: (detail.message || `push failed (${res.status})`) + hint };
    }
    const out = (await res.json()) as { commit?: { sha?: string } };
    return { status: "pushed", commit: out.commit?.sha?.slice(0, 7) };
  } catch (e) {
    return { status: "failed", reason: e instanceof Error ? e.message : "push failed" };
  }
}
