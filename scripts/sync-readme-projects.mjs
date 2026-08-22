#!/usr/bin/env node
// Add newly-published repos to the project tables in the profile README.
//
// Deliberately append-only: rows already in the README are never rewritten, so
// the hand-written descriptions (the ones carrying real metrics) survive. A repo
// is "new" only if nothing in the README links to it yet.
//
// Skip a repo by giving it the topic `no-readme`, or by archiving it.

import { readFileSync, writeFileSync } from "node:fs";

const USER = process.env.GH_USER || "rishika1099";
const FILE = process.env.README_PATH || "README.md";
const token = process.env.GITHUB_TOKEN;

// section heading -> the categories that belong under it
const SECTIONS = [
  { heading: "## ⚙️ LLM Systems, Inference & Evaluation", cats: ["LLM Systems"] },
  { heading: "## 🤖 Generative AI, NLP & Agentic Systems", cats: ["Generative AI", "Agentic AI", "NLP"] },
  { heading: "## 📈 Causal Inference & Statistical Modeling", cats: ["Causal Inference", "Statistical Modeling"] },
  { heading: "## 🧬 Deep Learning & Computer Vision", cats: ["Deep Learning", "Computer Vision"] },
  { heading: "## ⚡ High Performance Machine Learning", cats: ["High Performance ML"] },
  { heading: "## 🔐 Cybersecurity & Privacy", cats: ["Cybersecurity"] },
  { heading: "## 🧠 Machine Learning & Predictive Analytics", cats: ["Machine Learning"] },
];

const BADGE = {
  "Machine Learning": "Machine_Learning-F57C00",
  "Deep Learning": "Deep_Learning-D84315",
  "Computer Vision": "Computer_Vision-1E88E5",
  "Generative AI": "Generative_AI-8E24AA",
  "Agentic AI": "Agentic_AI-5E35B1",
  NLP: "NLP-039BE5",
  RAG: "RAG-00ACC1",
  "Causal Inference": "Causal_Inference-43A047",
  "Statistical Modeling": "Statistical_Modeling-00897B",
  "Explainable AI": "Explainable_AI-FB8C00",
  "Multimodal AI": "Multimodal_AI-3949AB",
  "High Performance ML": "High_Performance_ML-5E35B1",
  "LLM Systems": "LLM_Systems-283593",
  Cybersecurity: "Cybersecurity-424242",
  Healthcare: "Healthcare-E91E63",
  Education: "Education-1E88E5",
  "Public Sector": "Public_Sector-6D4C41",
  Legal: "Legal-3949AB",
  "Human Rights": "Human_Rights-8E24AA",
  Finance: "Finance-43A047",
  Agriculture: "Agriculture-7CB342",
  "Food & Nutrition": "Food_%26_Nutrition-FF7043",
  "Creative AI": "Creative_AI-AB47BC",
  "Internet of Things": "Internet_of_Things-00838F",
};
const badge = (name) =>
  BADGE[name] ? `![${name}](https://img.shields.io/badge/${BADGE[name]}?style=flat-square)` : "";

// First match wins, so the more specific signals come first. Mirrors the
// classifier the site uses for the Work grid, so both agree on a new repo.
const CATEGORY_RULES = [
  // causal work says "inference" too, so it is matched before anything LLM-ish
  ["Causal Inference", /\b(causal|counterfactual|treatment-?effect|mediation|confound|estimand)/i],
  ["Cybersecurity", /\b(security|malware|crypto|blockchain|cyber|encrypt|cipher|intrusion|surveillance|threat)/i],
  // needs an explicit LLM signal, not a bare "inference" or "benchmark"
  ["Agentic AI", /\b(agent|agentic|crew|autogen|multi-?agent|orchestrat)/i],
  // an applied product (RAG app, assistant, multimodal companion) reads as
  // Generative AI; the infra and eval tooling below is what "LLM Systems" means
  ["Generative AI", /\b(rag|retrieval-augmented|multimodal|assistant|companion|chatbot|generative|diffusion|dall|text-?to-|recipe|coaching|recommendation|personali[sz]ed|web app)/i],
  ["LLM Systems", /\b(llm|gpt|prompt|kv-?cache|context.?window|speculative decoding|token budget|early.?exit|model router|inference profiler|refusal|chain-of-thought|self-consistency|structured output|reasoning chain|cross-model)/i],
  ["High Performance ML", /\b(triton|cuda|gpu|quantiz|hpc|kernel|throughput)/i],
  ["Computer Vision", /\b(vision|cnn|resnet|vgg|yolo|segmentation|object detection|ocr|x-?ray|ct scan|image)/i],
  ["NLP", /\b(nlp|sentiment|language model|bert|tokeniz|summari|translation|fake news)/i],
  ["Statistical Modeling", /\b(statistic|shiny|\beda\b|distribution|hypothesis|bayesian)/i],
  ["Deep Learning", /\b(deep|neural|dnn|lstm|transformer|gan|autoencoder)/i],
  ["Machine Learning", /\b(machine learning|predict|forecast|churn|classif|regression|cluster)/i],
];

const DOMAIN_RULES = [
  ["Healthcare", /\b(health|clinic|medical|patient|disease|cancer|cardio|diabet|x-?ray|kidney|heart|glaucoma|retina)/i],
  ["Education", /\b(educat|course|tutor|student|exam|classroom|lecture)/i],
  ["Legal", /\b(legal|law|court|usc|precedent|contract)/i],
  ["Human Rights", /\b(human-?rights|welfare|child|refugee|equity)/i],
  ["Finance", /\b(finance|loan|stock|credit|bank|churn|revenue)/i],
  ["Agriculture", /\b(plant|crop|agricultur|farm|soil)/i],
  ["Food & Nutrition", /\b(food|recipe|nutrition|diet|meal|cook|pantry|wine)/i],
  ["Public Sector", /\b(public|government|policy|civic|municipal)/i],
  ["Internet of Things", /\b(iot|sensor|arduino|esp32|raspberry ?pi|mqtt|embedded)/i],
];

const firstMatch = (rules, text) => rules.find(([, re]) => re.test(text))?.[0];
const allMatches = (rules, text, max) => rules.filter(([, re]) => re.test(text)).map(([k]) => k).slice(0, max);

async function fetchRepos() {
  const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=updated`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json();
}

const prettyName = (slug) => slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Tech stack cell: the repo's topics if it has them, else its language. */
function techStack(r) {
  const skip = new Set(["llm", "ai", "ml", "python"]);
  const topics = (r.topics ?? []).filter((t) => !skip.has(t)).slice(0, 4).map(prettyName);
  const parts = [r.language, ...topics].filter(Boolean);
  return parts.length ? [...new Set(parts)].join(", ") : "Python";
}

function buildRow(r) {
  const text = `${r.name} ${r.description ?? ""} ${(r.topics ?? []).join(" ")} ${r.language ?? ""}`;
  const category = firstMatch(CATEGORY_RULES, text) ?? "Machine Learning";
  const domains = allMatches(DOMAIN_RULES, text, 2);
  const tags = [...domains, category].map(badge).filter(Boolean).join(" ");
  const desc = (r.description ?? "A little experiment on GitHub").replace(/\|/g, "\\|").trim();
  const row = `| [${r.name}](${r.html_url}) | ${desc} | ${techStack(r)} | ${tags} |`;
  return { category, row };
}

/** Append a row to the table under `heading`, right after its last existing row. */
function insertRow(md, heading, row) {
  const at = md.indexOf(heading);
  if (at === -1) return null;
  const lines = md.split("\n");
  const headingLine = lines.findIndex((l) => l.trim() === heading.trim());
  if (headingLine === -1) return null;
  let last = -1;
  let separator = -1;
  for (let i = headingLine + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ") || lines[i].startsWith("# ")) break;
    if (separator === -1 && /^\|\s*-{2,}/.test(lines[i])) separator = i;
    if (lines[i].startsWith("| [")) last = i;
  }
  // an empty table still has its header separator to append after
  if (last === -1) last = separator;
  if (last === -1) return null;
  lines.splice(last + 1, 0, row);
  return lines.join("\n");
}

/** Skills to suggest on LinkedIn: the repo's own language and topics, plus its area. */
function linkedinSkills(r, category) {
  const skip = new Set(["llm", "ai", "ml"]);
  const topics = (r.topics ?? []).filter((t) => !skip.has(t)).map(prettyName);
  return [...new Set([r.language, category, ...topics].filter(Boolean))].slice(0, 6).join(", ");
}

/**
 * Open an issue holding paste-ready LinkedIn copy. LinkedIn has no public API
 * for the profile's Projects section, and automating the form would breach
 * their terms, so the writing is automated and the four clicks stay manual.
 */
async function openLinkedInIssue(entries) {
  if (!token) {
    console.log("(no token: skipping the LinkedIn issue)");
    return;
  }
  const repo = process.env.GITHUB_REPOSITORY || `${USER}/${USER}`;
  const body = [
    "New project" + (entries.length > 1 ? "s" : "") + " to add to your LinkedIn **Projects** section.",
    "",
    "LinkedIn has no API for this section, so this is copy-paste ready rather than automatic.",
    "",
    ...entries.flatMap(({ repo: r, category }) => [
      `### ${prettyName(r.name)}`,
      "",
      `**Project name:** ${prettyName(r.name)}`,
      `**Description:** ${(r.description ?? "").trim() || "(add a line)"}`,
      `**Skills:** ${linkedinSkills(r, category)}`,
      `**Link:** ${r.html_url}`,
      "",
    ]),
    "Close this once they are added ✦",
  ].join("\n");

  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `Add to LinkedIn: ${entries.map((e) => prettyName(e.repo.name)).join(", ")}`.slice(0, 200),
      body,
    }),
  });
  console.log(res.ok ? "LinkedIn issue opened." : `Could not open the issue (${res.status}).`);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  let md = readFileSync(FILE, "utf8");
  const linked = new Set(
    [...md.matchAll(/github\.com\/rishika1099\/([A-Za-z0-9_.-]+)/g)].map((m) => m[1].replace(/\)$/, "")),
  );

  const repos = (await fetchRepos()).filter(
    (r) =>
      !r.fork &&
      !r.archived &&
      !r.private &&
      r.name.toLowerCase() !== USER.toLowerCase() &&
      !(r.topics ?? []).includes("no-readme") &&
      !linked.has(r.name),
  );

  if (!repos.length) {
    console.log("No new repos to add.");
    return;
  }

  const added = [];
  const forLinkedIn = [];
  for (const r of repos.reverse()) {
    const { category, row } = buildRow(r);
    const section = SECTIONS.find((s) => s.cats.includes(category)) ?? SECTIONS.at(-1);
    const next = insertRow(md, section.heading, row);
    if (!next) {
      console.log(`! could not place ${r.name} (section "${section.heading}" not found)`);
      continue;
    }
    md = next;
    added.push(`${r.name} -> ${section.heading.replace(/^##\s*/, "")}`);
    forLinkedIn.push({ repo: r, category });
  }

  if (!added.length) {
    console.log("Nothing placed.");
    return;
  }
  console.log(`Adding ${added.length}:`);
  added.forEach((a) => console.log("  +", a));
  if (dryRun) {
    console.log("\n(dry run, README not written)");
    return;
  }
  writeFileSync(FILE, md);
  console.log("README updated.");
  if (forLinkedIn.length) await openLinkedInIssue(forLinkedIn);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
