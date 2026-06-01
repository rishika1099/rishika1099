# 🌸 Portfolio of a Data Scientist & AI Engineer

A personal portfolio + creative corner, built as a Studio-Ghibli-pastel, soft-animated
Next.js site. It doubles as a little playground for data-science and AI ideas: the
content isn't just *displayed*, parts of it are *generated, organized, and answered by models*.

Live: https://rishika-m.netlify.app

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
- **Ask-my-portfolio chatbot (RAG).** A floating "ask about me" widget answers questions
  grounded in a knowledge base built from the bio, education, experience, research, and
  **every project's GitHub README** (fetched and cleaned). It retrieves the top chunks by
  embedding similarity, then answers with `gpt-4o-mini`, citing its sources and refusing to
  invent facts (poems/photos are deliberately excluded). *Eval:* `npm run eval:chat` reports
  retrieval hit rate, answer accuracy, and refusal correctness on a labeled question set.
  (`src/lib/rag.ts`, `src/lib/knowledge.ts`, `src/lib/github-readme.ts`,
  `src/app/api/ask/route.ts`, `src/components/AskMe.tsx`)
- **Live GitHub project sync + auto-categorization.** The Work tab fetches public repos
  straight from GitHub (ISR, hourly) and **classifies each one** into a technical area
  (Generative AI, Causal Inference, Computer Vision, etc.) and a domain (Healthcare,
  Finance, …) using a keyword/topic matcher, so new projects appear on their own.
  (`src/lib/github-projects.ts`)
- **Skills as a network graph.** The About page renders skills as a force-directed-style
  cluster graph: specialty areas are hubs, tools/methods orbit them, all wired into a
  little mesh you can pan and zoom. (`src/components/SkillGraph.tsx`)
- **Private content store.** Poems, their art, and photos are confidential, they live in
  **Netlify Blobs** (never committed to Git) and are read at request time on the deployed
  site, with a local-folder fallback for development. (`src/lib/blobs.ts`,
  `poems-store.ts`, `photos.ts`)

---

## ✨ Site features

- **Per-tab "vibes":** each page has its own pastel gradient scenery, drifting clouds,
  twinkling sparkles, and a synced card-hover tint.
- **Home:** flower-framed portrait, animated cursive name, quick links.
- **About:** expandable study/work/research cards, and the skills network graph.
- **Work:** semantic search box + featured projects + filterable grid (by technical area
  and domain), auto-fed from GitHub.
- **Writing room (Blog):** three doors, Technical Blogs (Markdown + external Substack
  links), Poems (password-gated, with AI art + mood filter), and Photography
  (auto-captioned + auto-clustered).
- **Ask-about-me chatbot:** a floating widget, available site-wide, that answers questions
  about Rishika from her real portfolio with source citations.
- **Contact:** ways to reach me + a message form.
- **Responsive** with a mobile menu, and **no em dashes anywhere** (a personal style rule).

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
