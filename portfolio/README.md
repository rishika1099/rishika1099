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
  that filters the grid down to its nearest neighbors by **embedding cosine similarity**,
  reusing the cached project vectors (no query embedding needed).
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
  is also assigned a **distinct on-theme emoji** from its own words (a gateway → 🚦, a
  benchmark → 🧪), with collisions nudged to a related icon so no two repeat.
  (`src/lib/github-projects.ts`)
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
- **About:** expandable study/work/research cards, and the skills network graph.
- **Work:** semantic search box + ELI5/expert toggle + featured projects + filterable grid
  (by technical area and domain, auto-fed from GitHub) + the embeddings galaxy.
- **Project cards:** code + live demo, plus optional 📊 results-dashboard and 📰 article
  (Substack) links, freely editable tags (anything, not just the built-in taxonomy), and
  inline first-page previews for PDF attachments.
- **Writing room (Blog):** three doors, Technical Blogs (Markdown + Substack posts pulled
  and tagged automatically by embedding similarity), Poems (password-gated and **re-locking
  on every refresh**, with AI art + mood
  filter), and Photography (auto-captioned + auto-clustered).
- **Quick jump (⌘K):** a command palette to fuzzy-jump to any page or project.
- **Ask-about-me chatbot:** a floating widget, available site-wide, that answers questions
  about Rishika from her real portfolio with source citations.
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
