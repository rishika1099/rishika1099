/**
 * Evaluation harness for the ask-my-portfolio chatbot.
 *
 * Runs a hand-labeled question set through the live /api/ask endpoint and
 * reports three metrics:
 *   1. Retrieval hit rate  - did the expected source chunk appear in top-k?
 *   2. Answer accuracy      - does the answer contain the expected fact?
 *   3. Refusal correctness  - does it decline / defer on out-of-scope questions
 *                             instead of hallucinating?
 *
 * Run:  node scripts/eval-chat.mjs   (needs the dev server running)
 */

const BASE = process.env.EVAL_BASE ?? "http://localhost:3000";

// Grounded questions: expect a specific source + a fact in the answer.
const grounded = [
  { q: "What did Rishika do at Shell?", source: "Software Engineer", any: ["forecast", "23%", "databricks"] },
  { q: "Tell me about her clinical LLM research.", source: "Clinical LLM", any: ["clinical", "notes", "phenotyp", "cardiac"] },
  { q: "What was her GPA at Columbia?", source: "M.S. in Data Science", any: ["3.87"] },
  { q: "Where did she do her undergrad?", source: "B.Tech", any: ["vit", "vellore"] },
  { q: "What is the KV-Cache project about?", source: "KV-Cache", any: ["quantiz", "compress", "decod", "throughput"] },
  { q: "Did she work on anything about human rights?", source: "Human Rights", any: ["due diligence", "defense", "manufactur", "un"] },
  { q: "What did she build for child welfare?", source: "Data Science Intern", any: ["risk", "fairness", "explainable"] },
  { q: "What are her main skill areas?", source: "Skills", any: ["causal", "generative", "machine learning", "nlp"] },
  { q: "Tell me about the Federal Eagle project.", source: "Federal Eagle", any: ["legal", "agent", "rag"] },
  { q: "What did she do at Novartis?", source: "Technical Analyst Intern", any: ["clinical-trial", "sentiment", "summar", "carbon"] },
];

// Out-of-scope: should defer/refuse, not invent an answer.
const refusals = [
  "What is Rishika's favorite poem?",
  "What is her phone number?",
  "Who won the 2024 Super Bowl?",
];
const REFUSAL_MARKERS = ["not sure", "don't have", "do not have", "isn't", "is not", "not available", "reach out", "contact", "can't", "cannot", "don't know"];

async function ask(question) {
  const res = await fetch(`${BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for: ${question}`);
  return res.json();
}

const lc = (s) => s.toLowerCase();

let retrievalHits = 0;
let answerHits = 0;

console.log("\n=== grounded questions ===\n");
for (const t of grounded) {
  const { answer, sources } = await ask(t.q);
  const a = lc(answer);
  const gotSource = (sources ?? []).some((s) => lc(s.title).includes(lc(t.source)));
  const gotFact = t.any.some((k) => a.includes(lc(k)));
  if (gotSource) retrievalHits++;
  if (gotFact) answerHits++;
  console.log(`Q: ${t.q}`);
  console.log(`   retrieval: ${gotSource ? "✓" : "✗"} (want "${t.source}")   fact: ${gotFact ? "✓" : "✗"}`);
  console.log(`   A: ${answer.slice(0, 160)}${answer.length > 160 ? "…" : ""}\n`);
}

let refusalHits = 0;
console.log("=== out-of-scope (should defer) ===\n");
for (const q of refusals) {
  const { answer } = await ask(q);
  const deferred = REFUSAL_MARKERS.some((m) => lc(answer).includes(m));
  if (deferred) refusalHits++;
  console.log(`Q: ${q}`);
  console.log(`   deferred: ${deferred ? "✓" : "✗"}`);
  console.log(`   A: ${answer.slice(0, 160)}${answer.length > 160 ? "…" : ""}\n`);
}

const pct = (n, d) => `${Math.round((n / d) * 100)}% (${n}/${d})`;
console.log("=== summary ===");
console.log(`retrieval hit rate : ${pct(retrievalHits, grounded.length)}`);
console.log(`answer accuracy    : ${pct(answerHits, grounded.length)}`);
console.log(`refusal correctness: ${pct(refusalHits, refusals.length)}`);
