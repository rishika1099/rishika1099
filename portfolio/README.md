# 🌸 rishika.netlify — a whimsical data-science portfolio

A personal portfolio + creative corner, built as a Studio-Ghibli-pastel, soft-animated
Next.js site. It doubles as a little playground for data-science and AI ideas: the
content isn't just *displayed*, parts of it are *generated and organized by models*.

Live: https://rishika-m.netlify.app

---

## 🤖 Data science & AI under the hood

This isn't a static site, several pieces are powered by ML/LLM pipelines:

- **AI-generated poem art.** Each poem gets its own piece of symbolic black-and-white
  art. A language model reads the poem and distills it into a single evocative image
  prompt (never literal), then an image model renders it. Images are generated **once**
  and cached forever, so they never regenerate or change. (`scripts/generate-media.mjs`,
  `src/lib/poemArt.ts`)
- **Auto-captioned photography.** Drop a photo into the gallery and a vision model writes
  a short, journal-style caption for it (low-detail inference to stay fast and cheap).
  Captions are generated once per new photo. (`generate-media.mjs`)
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
- **Work:** featured projects + filterable grid (by technical area and domain),
  auto-fed from GitHub.
- **Writing room (Blog):** three doors, Technical Blogs (Markdown + external Substack
  links), Poems (password-gated, with the AI art), and Photography (auto-captioned).
- **Contact:** ways to reach me + a message form.
- **Responsive** with a mobile menu, and **no em dashes anywhere** (a personal style rule).

---

## 🛠️ Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion ·
OpenAI API (text, image, vision) · Netlify Blobs · deployed on Netlify.

---

## 🧑‍🍳 Local workflow

```bash
npm run dev        # local dev server
npm run media      # generate poem art + photo captions for new files (uses OPENAI_API_KEY)
npm run sync       # publish poems/photos/art to Netlify Blobs (uses NETLIFY_* tokens)
npm run publish    # media + sync in one go
npm run build      # production build
```

Environment variables live in `.env.local` (never committed). See `.env.example`.

> Poems and photos are intentionally kept out of Git. Generated art and captions are too.
