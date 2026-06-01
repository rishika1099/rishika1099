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

> Reproduce: `npm run eval:chat` for the chatbot; clustering and mood metrics are written
> to `clusters.json` / `moods.json` during `npm run media`.
