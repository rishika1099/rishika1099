---
title: "Making LLMs Remember Cheaper: A Tour of KV-Cache Optimization"
date: "2026-04-12"
excerpt: "Why the KV cache eats your GPU memory, and four tricks — KIVI, TopK, SnapKV, and MLA — that win it back without losing quality."
---

When you run inference on a large language model, the quiet villain isn't the
weights — it's the **KV cache**. Every token the model has already seen leaves
behind a key and value vector at every layer, and those add up fast. On
Llama-2-7B with long contexts, the cache can dwarf everything else.

## The four tricks

I benchmarked four families of optimization:

- **KIVI** — quantize the cache to 4-bit. Cheapest win, biggest payoff.
- **TopK sparse selection** — only attend to the most relevant past tokens.
- **SnapKV eviction** — drop tokens the model has stopped caring about.
- **MLA latent compression** — project keys/values into a smaller latent space.

## What actually happened

> KIVI 4-bit gave **4× compression** while holding LongBench quality
> (0.292 vs. 0.291 baseline) — and decode throughput jumped **1.93×**.

Stacking the techniques pushed maximum batch capacity from 32 to 128, a
**3.1× peak throughput improvement**. The lesson: memory, not compute, is
often the ceiling — and you can lift it with surprisingly little quality cost.

*(This is a starter post — swap in your real writing whenever you like.)*
