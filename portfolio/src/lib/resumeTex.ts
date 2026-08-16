// Turn the LaTeX resume into structured blocks, so /resume/print renders the
// real resume (the same source the PDF is compiled from) instead of a second
// copy that quietly drifts out of sync.
//
// This understands the macros the resume template actually uses:
//   \section{...}
//   \resumeSubheading{A}{B}{C}{D}   -> bold A ... right B / italic C ... right D
//   \resumeProjectHeading{A}{B}     -> bold A ... right B
//   \resumeItem{...}                -> a bullet under the entry above it
// plus a free-text fallback for section bodies with no entries (Skills).
//
// Note the slot order differs by section in this template (Education puts the
// location second and dates fourth, Work does the opposite), so slots are kept
// positional and rendered the way the template lays them out, never guessed at.

export interface ResumeEntry {
  left: string; // bold primary: role, school, or project name
  right: string; // right-aligned: dates or location
  subLeft?: string; // italic secondary: org or degree
  subRight?: string; // italic right: location or dates
  bullets: string[];
}

export interface ResumeSection {
  title: string;
  entries: ResumeEntry[];
  /** free-form lines for sections that aren't an entry list (Skills) */
  lines: string[];
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s: string) => esc(s).replace(/"/g, "&quot;");

// commands that only affect print layout and carry no content
const DROP_WITH_GROUP = new Set(["vspace", "hspace", "label", "hypersetup"]);
const SYMBOLS: Record<string, string> = {
  cdot: "·", times: "×", pm: "±", approx: "≈", ge: "≥", le: "≤", ldots: "…",
  textbullet: "•", rho: "ρ", alpha: "α", beta: "β", mu: "μ", sigma: "σ",
  lambda: "λ", delta: "δ", chi: "χ", kappa: "κ", ",": " ", " ": " ",
};

/** Read a balanced {...} starting at `from` (which must be the "{"). */
function readGroup(src: string, from: number): { body: string; end: number } | null {
  if (src[from] !== "{") return null;
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (c === "\\") {
      i++; // escaped char, never a delimiter
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return { body: src.slice(from + 1, i), end: i + 1 };
    }
  }
  return null;
}

/** LaTeX fragment -> safe HTML (escaped text plus a tiny whitelist of tags). */
export function texToHtml(src: string): string {
  let out = "";
  let i = 0;
  while (i < src.length) {
    const c = src[i];

    if (c === "\\") {
      // escaped literal, e.g. \& \% \_ \# \{ \} \$
      const next = src[i + 1];
      if (next && "&%$#_{}".includes(next)) {
        out += esc(next);
        i += 2;
        continue;
      }
      // \\ (line break), with an optional [2pt] spacing argument
      if (next === "\\") {
        let j = i + 2;
        const bracket = /^\s*\[[^\]]*\]/.exec(src.slice(j));
        if (bracket) j += bracket[0].length;
        out += "<br/>";
        i = j;
        continue;
      }
      const m = /^\\([a-zA-Z]+)\*?/.exec(src.slice(i));
      if (!m) {
        i++;
        continue;
      }
      const name = m[1];
      let j = i + m[0].length;
      const skipWs = () => {
        while (j < src.length && /\s/.test(src[j])) j++;
      };

      if (name === "href") {
        skipWs();
        const url = readGroup(src, j);
        if (!url) { i = j; continue; }
        j = url.end;
        skipWs();
        const text = readGroup(src, j);
        const href = url.body.trim();
        const safe = /^(https?:|mailto:)/i.test(href) ? href : "";
        let label = text ? texToHtml(text.body) : esc(href);
        // the resume prints bare URLs; on a web page drop the protocol so the
        // link reads as a label rather than a wall of address
        if (label === esc(href)) label = esc(href.replace(/^https?:\/\//i, "").replace(/\/$/, ""));
        out += safe
          ? `<a href="${escAttr(safe)}" target="_blank" rel="noreferrer">${label}</a>`
          : label;
        i = text ? text.end : j;
        continue;
      }

      if (name === "textbf" || name === "textit" || name === "emph" || name === "underline" || name === "textsc") {
        skipWs();
        const g = readGroup(src, j);
        if (!g) { i = j; continue; }
        const inner = texToHtml(g.body);
        out += name === "textbf" ? `<strong>${inner}</strong>`
          : name === "underline" || name === "textsc" ? inner
          : `<em>${inner}</em>`;
        i = g.end;
        continue;
      }

      // \begin{env} / \end{env} (plus optional [..] options): structural only
      if (name === "begin" || name === "end") {
        skipWs();
        const g = readGroup(src, j);
        if (g) j = g.end;
        const opts = /^\s*\[[^\]]*\]/.exec(src.slice(j));
        if (opts) j += opts[0].length;
        i = j;
        continue;
      }

      if (name === "fontsize") {
        // two numeric groups, then usually \selectfont
        skipWs();
        const a = readGroup(src, j);
        if (a) {
          j = a.end;
          skipWs();
          const b = readGroup(src, j);
          if (b) j = b.end;
        }
        i = j;
        continue;
      }

      if (DROP_WITH_GROUP.has(name)) {
        skipWs();
        const g = readGroup(src, j);
        i = g ? g.end : j;
        continue;
      }

      if (SYMBOLS[name]) {
        out += SYMBOLS[name];
        i = j;
        continue;
      }

      // any other command (\small, \item, \hfill, \selectfont, …): drop it
      i = j;
      continue;
    }

    // "--" and "---" become a plain hyphen (no en/em dashes anywhere)
    if (c === "-" && src[i + 1] === "-") {
      out += "-";
      i += src[i + 2] === "-" ? 3 : 2;
      continue;
    }
    if (c === "%") {
      const nl = src.indexOf("\n", i);
      i = nl === -1 ? src.length : nl + 1;
      continue;
    }
    if (c === "$" || c === "{" || c === "}") { i++; continue; }
    if (c === "~") { out += " "; i++; continue; }
    out += esc(c);
    i++;
  }
  return out.replace(/[ \t\n]+/g, " ").trim();
}

/** Parse the resume source into sections. Returns [] if it doesn't look parseable. */
export function parseResumeTex(tex: string): ResumeSection[] {
  const open = tex.indexOf("\\begin{document}");
  const close = tex.indexOf("\\end{document}");
  let body = tex.slice(
    open >= 0 ? open + "\\begin{document}".length : 0,
    close >= 0 ? close : undefined,
  );
  // drop whole-line comments so commented-out entries never surface
  body = body.split("\n").filter((l) => !/^\s*%/.test(l)).join("\n");

  // locate the section headings
  const marks: { title: string; cmdStart: number; from: number }[] = [];
  const secRe = /\\section\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = secRe.exec(body))) {
    const g = readGroup(body, secRe.lastIndex - 1);
    if (!g) continue;
    marks.push({ title: texToHtml(g.body), cmdStart: m.index, from: g.end });
    secRe.lastIndex = g.end;
  }

  const sections: ResumeSection[] = [];
  for (let k = 0; k < marks.length; k++) {
    const chunk = body.slice(marks[k].from, marks[k + 1]?.cmdStart ?? body.length);
    const entries: ResumeEntry[] = [];
    const lines: string[] = [];

    const tokRe = /\\(resumeSubheading|resumeProjectHeading|resumeItem)\b/g;
    let t: RegExpExecArray | null;
    while ((t = tokRe.exec(chunk))) {
      let j = tokRe.lastIndex;
      const skipWs = () => {
        while (j < chunk.length && /\s/.test(chunk[j])) j++;
      };
      const take = (n: number) => {
        const got: string[] = [];
        for (let x = 0; x < n; x++) {
          skipWs();
          const g = readGroup(chunk, j);
          if (!g) break;
          got.push(g.body);
          j = g.end;
        }
        return got;
      };

      if (t[1] === "resumeSubheading") {
        const g = take(4);
        if (g.length >= 2) {
          entries.push({
            left: texToHtml(g[0]),
            right: texToHtml(g[1]),
            subLeft: g[2] !== undefined ? texToHtml(g[2]) : undefined,
            subRight: g[3] !== undefined ? texToHtml(g[3]) : undefined,
            bullets: [],
          });
        }
      } else if (t[1] === "resumeProjectHeading") {
        const g = take(2);
        if (g.length) {
          entries.push({ left: texToHtml(g[0]), right: texToHtml(g[1] ?? ""), bullets: [] });
        }
      } else {
        const g = take(1);
        if (g.length) {
          const html = texToHtml(g[0]);
          if (!html) continue;
          if (entries.length) entries[entries.length - 1].bullets.push(html);
          else lines.push(html);
        }
      }
      tokRe.lastIndex = j;
    }

    // a section with no entries is free text (Skills): split it on \\ breaks
    if (!entries.length && !lines.length) {
      let s = chunk.replace(/\\vspace\*?\s*\{[^}]*\}/g, "").trim();
      if (s.startsWith("{")) {
        const g = readGroup(s, 0);
        if (g) s = g.body;
      }
      for (const part of s.split(/\\\\\s*(?:\[[^\]]*\])?/)) {
        const html = texToHtml(part);
        if (html) lines.push(html);
      }
    }

    if (entries.length || lines.length) {
      sections.push({ title: marks[k].title, entries, lines });
    }
  }
  return sections;
}
