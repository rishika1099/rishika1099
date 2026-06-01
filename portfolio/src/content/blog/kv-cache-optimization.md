---
title: "Your LLM Is Carrying Around an Entire Library Every Time It Answers You"
date: "2026-05-08"
excerpt: "How KIVI, TokenSelect, SnapKV, TopK-Flash, and MLA each try to solve the KV-cache bottleneck, with real experiments on Llama-2-7B running on H100 GPUs."
external: "https://rishika1099.substack.com/p/kv-cache-optimization"
tech: ["High Performance Machine Learning", "Generative AI"]
---

When you run inference on a large language model, the quiet villain isn't the
weights, it's the **KV cache**. Every token the model has already seen leaves
behind a key and value vector at every layer, and the model rereads its entire
conversation history over and over again. On Llama-2-7B with long contexts, the
cache can dwarf everything else.

This post tours five families of optimization, KIVI, TokenSelect, SnapKV,
TopK-Flash, and MLA, and benchmarks how each trades memory, throughput, and
quality on H100 GPUs.

Read the full post on Substack ✦
