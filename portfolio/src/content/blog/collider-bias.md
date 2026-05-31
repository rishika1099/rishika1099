---
title: "The Bug That Reverses Your Conclusion: Collider Bias"
date: "2026-03-02"
excerpt: "How conditioning on the wrong variable flipped a treatment effect from protective to harmful — and what it taught me about causal humility."
---

In a re-analysis of the Moertel 1990 colon-cancer trial, I watched a treatment
go from *helpful* to *harmful* — not because the data changed, but because I
controlled for the wrong thing.

## What is a collider?

A collider is a variable caused by two others. Condition on it, and you open a
fake path between things that were never related — a statistical mirage.

Adjusting for a post-treatment variable turned a hazard ratio of **0.69**
(protective) into **1.10** (harmful). Same patients. Opposite story.

## The takeaway

Causal inference isn't about throwing every covariate into a regression. It's
about knowing *which* arrows to cut. Draw the DAG first. Always.

*(Starter post — replace with your own writing whenever you're ready.)*
