// The LaTeX source behind the resume. Edited in the atelier's Overleaf-style
// editor, compiled to PDF in the browser (SwiftLaTeX), and the compiled PDF is
// what /resume serves. This module just persists the .tex text: Netlify Blobs
// on deploy, a gitignored local file in dev.

import fs from "node:fs";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";

const KEY = "resume.tex";
const LOCAL_DIR = path.join(process.cwd(), "src/content/files");

// A simple, package-free starter so the first compile always works. The
// compile service runs full TeX Live, so feel free to paste in any resume
// template, \usepackage anything you like.
export const DEFAULT_RESUME_TEX = String.raw`\documentclass[11pt]{article}

% This starter uses only base LaTeX. The compiler runs full TeX Live, so any
% package works: geometry, hyperref, titlesec, enumitem, fontawesome5, ...
% or paste in a whole resume template from Overleaf.

\setlength{\parindent}{0pt}
\setlength{\textwidth}{6.5in}
\setlength{\oddsidemargin}{0in}
\setlength{\topmargin}{-0.5in}
\setlength{\textheight}{9in}
\pagestyle{empty}

\newcommand{\heading}[1]{%
  \vspace{10pt}{\large\bfseries #1}\vspace{2pt}\hrule\vspace{6pt}}

\begin{document}

\begin{center}
  {\huge\bfseries Rishika Mamidibathula}\\[4pt]
  Data Scientist \& ML Engineer $\cdot$ New York City\\[2pt]
  rm4318@columbia.edu $\cdot$ github.com/rishika1099 $\cdot$ linkedin.com/in/rishika-mamidibathula
\end{center}

\heading{Experience}
{\bfseries Data Science Intern} \hfill Summer 2026\\
NYC Administration for Children's Services\\
\begin{itemize}
  \item Explainable ML on sensitive child-welfare data, with fairness auditing.
  \item Causal adjustment for high-stakes public-sector decisions.
\end{itemize}

{\bfseries Research Assistant, Clinical LLM \& Phenotyping} \hfill Jan 2026 -- Present\\
Columbia University Irving Medical Center\\
\begin{itemize}
  \item Built an LLM pipeline turning years of clinical notes into structured data.
  \item HIPAA-safe de-identification with no protected data written to disk.
\end{itemize}

\heading{Education}
{\bfseries M.S. in Data Science}, Columbia University \hfill 2025 -- present\\
{\bfseries B.Tech, Computer Science \& Data Science}, VIT \hfill 2019 -- 2023

\end{document}
`;

export async function getResumeTex(): Promise<string> {
  try {
    if (blobsEnabled()) {
      const s = await store("files");
      const raw = (await s.get(KEY, { type: "text" })) as string | null;
      return raw && raw.trim() ? raw : DEFAULT_RESUME_TEX;
    }
    const f = path.join(LOCAL_DIR, KEY);
    if (fs.existsSync(f)) {
      const raw = fs.readFileSync(f, "utf8");
      return raw.trim() ? raw : DEFAULT_RESUME_TEX;
    }
  } catch {
    // fall through to the default
  }
  return DEFAULT_RESUME_TEX;
}

export async function saveResumeTex(tex: string): Promise<void> {
  if (blobsEnabled()) {
    const s = await store("files");
    await s.set(KEY, tex);
  } else {
    fs.mkdirSync(LOCAL_DIR, { recursive: true });
    fs.writeFileSync(path.join(LOCAL_DIR, KEY), tex, "utf8");
  }
}
