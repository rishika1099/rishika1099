# 🌸 Rishika Mamidibathula's Portfolio

A personal portfolio + creative corner, built as a Studio-Ghibli-pastel, soft-animated
Next.js site. It doubles as a little playground for data-science and AI ideas: the
content isn't just *displayed*, parts of it are *generated, organized, and answered by models*.

Live: https://rishika-m.com

---

## 🤖 Data science & AI under the hood

This isn't a static site, several pieces are powered by ML/LLM pipelines. Where it makes
sense, each one ships with a small **evaluation** so the quality is measured, not assumed.
Latest results live in [`docs/EVALUATIONS.md`](docs/EVALUATIONS.md).

- **AI-generated poem art.** Each poem gets its own piece of symbolic black-and-white
  art. A language model reads the poem and distills it into a single evocative image
  prompt (never literal), then an image model renders it. Images are generated **once**
  and cached forever. (`scripts/generate-media.mjs`, `src/lib/poemArt.ts`)
- **Poem mood tags + filter.** A language model classifies each poem into a mood
  (melancholy, longing, hope, love, peace, restless, dreamy, self-love) with a confidence
  score, and the Poems room gains colored mood pills + a filter. *Eval:* the page reports
  the classifier's average confidence. (`generate-media.mjs`, `src/lib/moods.ts`)
- **Auto-captioned photography.** Drop a photo into the gallery and a vision model writes
  a short, journal-style caption for it (low-detail inference to stay fast and cheap).
  (`generate-media.mjs`)
- **Image clustering for the gallery.** Photos are embedded with **CLIP image embeddings**
  and grouped with **k-means**, with the number of clusters chosen by **silhouette score**
  (tolerance-biased toward finer groups). Each cluster gets an auto-generated theme label.
  Re-runs whenever a new photo is added. *Eval:* the gallery shows the silhouette score and
  cluster count. (`scripts/cluster-photos.mjs`, `src/lib/photos.ts`)
- **Semantic "search my projects".** A search box on the Work tab embeds your phrase and
  every project with OpenAI embeddings and ranks by **cosine similarity**, so search works
  by meaning, not keywords. Weak matches are thresholded out, and the raw cosine is rescaled
  into an intuitive relevance %. *Eval:* each result shows its relevance score.
  (`src/lib/search.ts`, `src/app/api/search-projects/route.ts`)
- **"More like this" project suggestions.** Each project card has a "find similar" action
  that narrows the page to its nearest neighbors by **embedding cosine similarity**, reusing
  the cached project vectors (no query embedding needed). It answers in place on whichever
  page you are reading, and coming back returns you to where you were standing rather than
  to the top.
  (`src/lib/search.ts` `relatedProjects`, `src/app/api/related-projects/route.ts`)
- **Embeddings galaxy.** An interactive 2D map of every project: each is embedded, then
  projected to 2D with a hand-rolled **PCA** (via the n×n Gram matrix) on a graph-paper grid.
  Each project shows as its emoji on a dot colored by its real technical area, so nearby dots
  tend to be semantically similar and the colors stay truthful (no fuzzy cluster mislabeling).
  (`src/lib/search.ts` `projectMap`, `src/app/api/project-map/route.ts`,
  `src/components/ProjectGalaxy.tsx`)
- **ELI5 / expert toggle.** A toggle on the Work tab rewrites every project blurb for the
  chosen audience (a curious 10-year-old, or a senior ML engineer) in one batched, cached
  `gpt-4o-mini` call. (`src/lib/explain.ts`, `src/app/api/explain/route.ts`)
- **Descriptions written to fit the card.** Cards in a row are all as tall as the wordiest
  one, so a short blurb leaves a visible hole. Every description is rewritten to a shared
  shape (two sentences, 16 to 20 words each) grounded in the project's own README, or, for
  the About cards, in the entry's own details. Asking for a character count does not work
  (told "150 to 185 characters" the model landed 7 of 79 inside the band), but asking for a
  shape gets the length as a side effect: spread fell from 149 characters to 70, and the
  median gap above the buttons from 74px to 32px. It is told to leave a description short
  rather than invent something to fill with, and the rules it kept breaking (opening by
  restating the project's own name, consultant filler like "leveraging" and "seamless") are
  checked in code afterwards, with the offenders re-asked and the retry only accepted if it
  actually fixed the violation. (`src/lib/explain.ts`)
- **Pipeline diagrams, drawn not uploaded.** Nobody screenshots ninety-eight repos, but a
  README usually describes a pipeline and a pipeline draws well. The stages are read out of
  each README once and rendered as inline SVG in the same pastels the chips use, so it is in
  the HTML with no client JavaScript and no chart library. A README with no pipeline in it
  caches the empty answer and shows nothing, because an absent picture beats an invented
  one. (`src/lib/pipeline.ts`, `src/components/PipelineDiagram.tsx`)
- **Case studies drafted from the repo.** Every project on the recruiter page opens into a
  deep dive: the problem, how it works, what it found, and up to four headline numbers,
  drafted from the README and never estimated or rounded. A hand-written case study always
  wins, and the two live in separate stores so a draft can never overwrite one.
  (`src/lib/caseStudyAuto.ts`, `src/lib/caseStudies.ts`)
- **Paste a job description, and the page answers it.** The four role buttons are a
  guess at what a reader wants; a posting is the thing itself. It ranks the projects
  against it and re-angles her experience toward it. Two details make it honest rather
  than flattering. **The skills are checked, not claimed**: asked for "the skills this
  posting asks for that the resume evidences", the model returned Swift, SwiftUI, Core
  Data and UIKit for an iOS posting, which are the posting's requirements and not her
  skills, so a skill now survives only if the words carrying its meaning appear in her
  own material, on both word boundaries (a leading boundary alone let "Swift" through on
  the strength of "Hey Swiftie"). And **the gaps are reported**: what a posting asks for
  that her material does not show. An iOS posting claims no skills and names three gaps;
  a healthcare ML posting keeps Python, PyTorch, LLMs and retrieval systems with none.
  (`src/lib/tailor.ts`, `src/app/api/tailor/route.ts`)
- **Re-angling, not relabelling.** Her human-rights LLM research is the closest thing she
  has to a healthcare LLM role, and read as irrelevant because the subject differs: same
  pipelines, same evaluation problem, different domain. Each entry's note is rewritten to
  lead with whatever answers the role, out of what the entry already says. Nothing may be
  added, so the honest angle is "a two-stage retrieval-augmented LLM framework, scoring
  defense manufacturers on human-rights due diligence", never "healthcare research", and
  an entry with no bearing on the role comes back unchanged rather than stretched. The
  cards do not change: the angled note arrives through the same context the About page
  already feeds them through. Cached per role, since the four roles are fixed.
  (`src/lib/angle.ts`)
- **Embedding a whole posting does not work.** A long posting averages out to a blur: the
  scores bunched between 0.42 and 0.50 and her flagship clinical work ranked below a
  loan-status exercise for a clinical AI job. The model reduces the posting to its
  technical line first and the search runs on that, which is both better and faster
  (6.5s to 3.1s).
- **Generated once, then never again.** Everything above is cached **per item** against a
  hash of the source it was generated from, not per set. Keying a whole set under one hash
  meant publishing a single repo changed the signature and threw away all 98 rewrites to
  gain one card. Now a new project costs one project: cold 5.9s, warm 0.295s and byte
  identical, and one new repo rebuilds exactly one entry. Netlify Blobs in production, a
  gitignored file in dev, where without it every restart re-paid for the lot.
  (`src/lib/genCache.ts`)
- **Ask-my-portfolio chatbot (RAG).** A floating "ask about me" widget answers questions
  grounded in a knowledge base built from the bio, education, experience, research,
  **every project's GitHub README** (fetched and cleaned), and her **Substack posts** (pulled
  from the RSS feed). It retrieves the top chunks by embedding similarity, then **streams**
  the answer token-by-token from `gpt-4o-mini`, cites its sources, suggests follow-up
  questions, and refuses to invent facts (poems and photos are deliberately excluded).
  *Eval:* `npm run eval:chat` reports retrieval hit rate, answer accuracy, and refusal
  correctness on a labeled question set (currently 100% on all three).
  (`src/lib/rag.ts`, `src/lib/knowledge.ts`, `src/lib/github-readme.ts`,
  `src/lib/substack.ts`, `src/app/api/ask/route.ts`, `src/components/AskMe.tsx`)
- **Live GitHub project sync + auto-categorization.** The Work tab fetches public repos
  straight from GitHub (ISR, hourly) and **classifies each one** into a technical area
  (Generative AI, Causal Inference, Computer Vision, etc.) and a domain (Healthcare,
  Finance, …) using a keyword/topic matcher, so new projects appear on their own. Each one
  is also assigned an **on-theme emoji** from its own words across ~46 keyword themes
  (a gateway → 🚦, a benchmark → 🧪, a camera trap → 🦌). Each theme offers several icons,
  and when they run out a project reuses its own theme's icon rather than reaching for an
  unrelated one: a sensible repeat beats a unique absurdity at 80+ projects. Any guess can
  be overridden by hand in the project editor, so a wrong icon is a ten-second fix rather
  than a regex change. (`src/lib/github-projects.ts`)
- **Auto-pulled blog with embedding zero-shot tagging.** New Substack posts flow into the
  Technical Blogs page on their own (RSS, ISR hourly): the title, date, and subtitle (the
  RSS `<description>`) are parsed out, and each post is **tagged by an embedding zero-shot
  text classifier** rather than brittle keyword rules. Every technical-area and domain
  label is described with a few short phrases that are embedded and **averaged into one
  prototype vector** (multi-prototype denoising); the post is embedded once (title weighted
  2×, since it's the strongest topic signal) and scored against all labels by **cosine
  similarity**. The closest area wins (argmax), while a domain is only attached when it
  **clears a confidence floor *and* clearly beats the runner-up**, so ambiguous or incidental
  matches get no tag instead of a wrong one. Label vectors are cached per server and posts
  are embedded in one batched call; if the embeddings API is unavailable it **degrades
  gracefully to the keyword classifier**. (`src/lib/classify.ts`, `src/lib/substack.ts`,
  `src/app/blog/technical/page.tsx`)
- **Skills as a network graph.** The About page renders skills as a force-directed-style
  cluster graph: specialty areas are hubs, tools/methods orbit them, all wired into a
  little mesh you can pan, zoom, and open fullscreen. (`src/components/SkillGraph.tsx`)
- **Private content store.** Poems, their art, and photos are confidential, they live in
  **Netlify Blobs** (never committed to Git) and are read at request time on the deployed
  site, with a local-folder fallback for development. (`src/lib/blobs.ts`,
  `poems-store.ts`, `photos.ts`)

---

## ✨ Site features

- **Per-tab "vibes":** each page has its own pastel gradient scenery, drifting clouds,
  twinkling sparkles, and a synced card-hover tint. The active nav tab tints to match the
  page it leads to.
- **Home:** flower-framed portrait, animated cursive name, quick links.
- **About:** expandable education/work/research/certification cards, a sticky jump bar
  linking straight to each section (and `#research` style deep links), and the skills
  network graph.
- **Work:** semantic search box + ELI5/expert toggle + featured blooms, then every project
  **grouped by technical area**. Each area is a horizontal shelf that advances a card at a
  time on its own (pausing on hover, focus, touch, off-screen, and under reduced motion),
  with dots showing where you are and `show all as a grid` to open it out. A project
  appears under **every** area it belongs to, so an IoT intrusion detector shows up under
  Internet of Things, Computer Vision and Cybersecurity alike. A "patch" menu jumps between
  areas; the domain menu filters across areas and offers a way back. The areas are **tabs**
  rather than a stack: twelve of them rendered one under the other ran the page to 8486px,
  ten screens to reach the last, and side by side they fit in 3322px. Every panel still
  renders, hidden rather than unmounted, so the projects stay in the HTML for search.
  Areas and domains each carry their own emoji and tint, used identically on the chips, the
  headings and the menus. Then the embeddings galaxy.
- **Project cards:** code + live demo, plus optional 📊 results-dashboard and 📰 article
  (Substack) links, freely editable tags (anything, not just the built-in taxonomy), and
  inline first-page previews for PDF attachments.
- **Recruiter mode (`/recruiter`):** the same material with the volume down, for someone
  hiring for one specific role. It asks which of four roles (Data Scientist, ML Engineer,
  AI Engineer, Software Engineer) and then shows only what argues for it: selected projects,
  research, experience, education and skills. Relevance decides which projects are eligible;
  whether she wrote a project up decides the order among them, weighted far above the area
  tags, because dozens of small experiments carry a generic tag and a tie broken
  alphabetically put "Car Price Prediction" above the KV-cache work. The role lives in the
  URL so a chosen view is a link she can send, the page is `noindex` so it does not compete
  with the real pages, and the résumé is downloadable from the top. It uses the *same*
  project and entry cards the Work and About pages use, not copies of them. There is also
  a box to paste the posting itself, which filters the same page rather than producing a
  second one, and re-angles her experience toward what it asks for. Work, research and
  education are visible before any role is picked, since they do not depend on one.
- **One surface per page.** Dialogs portal to `<body>`, outside the page's vibe wrapper, so
  they cannot inherit the ground they were opened from and were hardcoded cream everywhere.
  Each page now publishes its own colour on the root element and anything rendered outside
  it (entry dialogs, the case-study modal, the floating ask launcher) reads
  `var(--page-surface)`. The same dialog paints periwinkle on the recruiter page and lilac
  on About, with no props passed. (`src/components/VibeSurface.tsx`)
- **Writing room (Blog):** three doors, Technical Blogs (Markdown + Substack posts pulled
  and tagged automatically by embedding similarity), Poems (password-gated and **re-locking
  on every refresh**, with AI art + mood
  filter), and Photography (auto-captioned + auto-clustered).
- **Quick jump (⌘K):** a command palette to fuzzy-jump to any page or project.
- **Ask-about-me chatbot:** a floating widget, available site-wide, that answers questions
  about Rishika from her real portfolio with source citations.
- **Editable in place:** nearly everything on the site is edited from the site itself, not in
  code. A key-gated **atelier** (plus little `/edit` rooms on each page) covers page copy,
  project names/blurbs/tags/links, About and Education entries, photos and their captions,
  the guestbook, and the LaTeX résumé. Edits are stored as overrides in **Netlify Blobs** and
  win at render time, so they go live instantly with no rebuild; the pages that read them
  render per request so an edit can never get stuck behind a cached build.
  (`src/lib/siteCopy.ts`, `aboutData.ts`, `projectOverrides.ts`)
- **Whimsy:** a butterfly cursor companion (desktop, respects reduced-motion).
- **Contact:** ways to reach me + a message form.
- **SEO:** sitemap, robots, and an auto-generated Open Graph preview image so links unfurl
  nicely. (`src/app/sitemap.ts`, `robots.ts`, `opengraph-image.tsx`)
- **Responsive** with a mobile menu, and **no em dashes anywhere** (a personal style rule).

---

## 🌟 Featured projects

A few of the projects showcased on the Work tab:

- **Folio: Clinical Multimodal RAG** — a multimodal medical-record companion unifying RAG,
  document understanding, speech, and vision; consensus extraction across LLMs hit 85.1%
  micro-F1 with sub-2s latency.
  ([code](https://github.com/rishika1099/Folio-Clinical-Multimodal-RAG) ·
  [demo](https://folio-health.vercel.app))
- **KV-Cache Optimization for LLM Inference** — benchmarked KIVI quantization, TopK
  sparsity, SnapKV eviction & MLA on Llama-2-7B with Triton kernels: 4× cache compression,
  1.93× faster decode, 3.1× peak throughput.
  ([code](https://github.com/rishika1099/KV-Cache-Optimization) ·
  [writeup](https://rishika1099.substack.com/p/kv-cache-optimization))
- **Colon Cancer Trial Causal Analysis** — causal re-analysis of the Moertel 1990 trial
  (n=929): ATE, CATE, mediation, transport; showed collider bias reversing the effect.
  ([code](https://github.com/rishika1099/Colon-Cancer-Trial-Causal-Analysis) ·
  [writeup](https://open.substack.com/pub/rishika1099/p/prediction-vs-causation))
- **Federal Eagle: AI Legal Assistant** — a multi-agent CrewAI system for U.S. federal legal
  analysis: semantic USC retrieval, precedent search, elements analysis, draft generation.
  ([code](https://github.com/rishika1099/Federal-Eagle-AI-Legal-Assistant) ·
  [demo](https://federal-eagle.streamlit.app/))
- **This portfolio** — the site itself: RAG chatbot, semantic search, embeddings galaxy,
  CLIP photo clustering, and an LLM poem-mood classifier.
  ([code](https://github.com/rishika1099/rishika1099) ·
  [live](https://rishika-m.com))

The full, always-current list is generated live on the Work tab (curated entries plus every
public GitHub repo, auto-categorized).

---

## 🛠️ Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion ·
OpenAI API (text, image, vision, embeddings, `gpt-4o-mini`) · CLIP image embeddings
(`@huggingface/transformers`) · Netlify Blobs · deployed on Netlify.

---

## 🧑‍🍳 Local workflow

```bash
npm run dev        # local dev server
npm run media      # generate poem art + moods + captions, then cluster photos (OPENAI_API_KEY)
npm run cluster    # re-cluster photos only (CLIP embeddings + k-means)
npm run sync       # publish poems/photos/art/captions/clusters/moods to Netlify Blobs
npm run publish    # media + sync in one go
npm run eval:chat  # evaluate the chatbot against a labeled question set (dev server running)
npm run build      # production build
```

Environment variables live in `.env.local` (never committed). See `.env.example`.

- `OPENAI_API_KEY` — required for search, the chatbot, and media generation.
- `GITHUB_TOKEN` — optional; lifts GitHub's unauthenticated rate limit when the chatbot
  fetches project READMEs. A scopeless classic token is enough.
- `NETLIFY_SITE_ID` / `NETLIFY_AUTH_TOKEN` — used by `npm run sync`.

> Poems and photos are intentionally kept out of Git. Generated art, captions, clusters,
> and moods are too.
