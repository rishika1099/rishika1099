# 📊 Evaluations

Each ML/LLM feature on this site ships with a way to measure its quality, not just
assert it. This is a snapshot of the latest results. Numbers depend on the current
content (poems, photos, projects), so they shift as that grows.

---

## 1. Ask-my-portfolio chatbot (RAG)

Harness: `npm run eval:chat` (`scripts/eval-chat.mjs`), a hand-labeled question set run
through the live `/api/ask` endpoint.

| metric | what it measures | result |
|---|---|---|
| Retrieval hit rate | did the correct source chunk land in the top-k? | **100% (10/10)** |
| Answer accuracy | does the answer contain the expected fact? | **100% (10/10)** |
| Refusal correctness | does it decline on out-of-scope questions instead of inventing? | **100% (3/3)** |

The three refusal cases ("favorite poem?", "phone number?", "2024 Super Bowl?") are
out-of-scope on purpose: the bot declines all three and points to the Contact page,
with zero hallucination. The poem refusal matters because poems are private/gated.

The answer streams token-by-token and ends with three suggested follow-up questions.
Streaming and follow-ups do not change retrieval or grounding, so these scores still hold.

---

## 2. Semantic project search

Method: query + every project embedded with `text-embedding-3-small`, ranked by cosine
similarity, weak matches (< 0.24) dropped, raw cosine rescaled to a relevance %.

Sample rankings (top match shown):

| query | top match | cosine |
|---|---|---|
| make LLMs run faster | KV-Cache Optimization | 0.45 |
| causal effect of a treatment | Colon Cancer Trial Causal Analysis | 0.54 |
| quantization and sparsity for transformer decoding | KV-Cache Optimization | 0.38 |
| gemini | Dr. Pixel (only real match; others correctly dropped) | 0.25 |

Each result card surfaces its relevance %, so the ranking is transparent to the visitor.

---

## 3. Photo gallery clustering

Method: CLIP image embeddings → k-means → k chosen by silhouette score (tolerance-biased
toward finer groups). Re-runs when a photo is added.

| metric | value |
|---|---|
| clusters (k) | 4 |
| silhouette score | 0.143 |
| cluster sizes | 15 / 8 / 6 / 2 |
| embedding | `clip-vit-base-patch32` (image) |

The silhouette is modest because the photo set is visually homogeneous (cityscape-heavy),
so the clusters overlap. Switching from caption-text embeddings to CLIP image embeddings
roughly doubled the silhouette (0.076 → 0.14) and produced more meaningful groups.

---

## 4. Poem mood classification

Method: a language model classifies each poem into one of eight moods with a confidence
score (temperature 0, JSON output).

| metric | value |
|---|---|
| poems classified | 8 |
| average confidence | 0.894 |
| distribution | melancholy 4 · longing 1 · love 1 · self-love 1 · hope 1 |

The Poems page reports the average classifier confidence as an honest quality signal.

---

## 5. Related projects & ELI5/expert toggle

Two lighter touches that reuse the same machinery:

- **Related projects** ("find similar") rank by cosine similarity over the cached project
  embeddings, the same vectors semantic search uses. Spot check: Folio (clinical RAG) →
  Dr. Pixel (medical imaging) + Prescribed Motion (LLM retrieval); KV-Cache → other
  LLM-systems work. Quality is the ranking itself; no separate metric.
- **ELI5/expert toggle** rewrites blurbs with `gpt-4o-mini` under a strict "keep every fact
  truthful, do not invent" instruction. Manual read-through confirmed the expert voice
  preserves the real metrics (e.g. Folio "85.1% micro-F1, sub-2s latency") and the ELI5
  voice stays jargon-free.

---

## 6. Embeddings galaxy (project clustering)

Method: every project embedded with `text-embedding-3-small`, projected to 2D with PCA (via
the Gram matrix), then grouped with **k-means** into a few broad themes (k chosen for the
best-separated grouping among k=3–4). Each cluster is named and explained by an LLM.

This is presented as a **grouping/visualization, not a separation claim**: silhouette stays
near 0 throughout (these projects sit on a continuous spectrum, and high-dimensional text
embeddings rarely separate cleanly), so the value is the interpretable themes, e.g.
Generative AI, Computer Vision, Predictive Analytics, NLP, confirmed by the LLM labels and a
manual read of each cluster's members.

---

> Reproduce: `npm run eval:chat` for the chatbot; clustering and mood metrics are written
> to `clusters.json` / `moods.json` during `npm run media`.
