import { projects as curated, type Category, type Domain, type Project } from "@/data/projects";
import { readProjectOverrides, repoSlug } from "@/lib/projectOverrides";

const GH_USER = "rishika1099";

// Auto-pulled repos often share a category (lots of "Generative AI"), so a
// category-only emoji leaves a wall of identical ✨. Each keyword rule offers
// several on-theme icons; a project's candidates are every matching rule's
// icons in priority order, so when two projects want the same icon the loser
// slides to the next RELATED one instead of a random flower. First rules win,
// so the more specific signals go first.
const EMOJI_RULES: [RegExp, string[]][] = [
  [/\b(encrypt|cipher|crypto|secure|auth|guard)/i, ["🔐", "🗝️", "🔏"]],
  [/\b(gateway|proxy|load ?balanc)/i, ["🚦", "🎛️", "🛂"]],
  [/\b(router|route|routing)/i, ["🧭", "🚦", "🛣️"]],
  [/\b(fail|debug|bug|minimiz|shrink|repro)/i, ["🐛", "🔬", "🩹"]],
  [/\b(context|window|long-?context|lost-?in-?the-?middle)/i, ["🪟", "📜", "🔭"]],
  [/\b(consistency|calibrat|agreement|self-?consist)/i, ["⚖️", "🎯", "📏"]],
  [/\b(reliab|harness|fault|robust)/i, ["🧰", "🛡️", "⚙️"]],
  [/\b(token|budget|early-?exit|cost)/i, ["🪙", "🎟️", "⏳"]],
  [/\b(speculat|draft|decoding)/i, ["🎲", "🃏", "🔮"]],
  [/\b(bench|benchmark|regression|test|ci\b|eval)/i, ["🧪", "📋", "✅"]],
  [/\b(stress|latency|throughput|profil|perf)/i, ["🌡️", "⏱️", "📉"]],
  [/\b(cache|kv-?cache|memory|quantiz)/i, ["🗃️", "🧊", "📦"]],
  [/\b(reason|chain-?of-?thought|cot\b|think)/i, ["🧩", "💭", "🧠"]],
  [/\b(prompt|template)/i, ["📝", "✍️", "📄"]],
  [/\b(search|retriev|rag|index|embed)/i, ["🔎", "📚", "🗂️"]],
  [/\b(vision|image|photo|camera|ocr)/i, ["🖼️", "📷", "🎨"]],
  [/\b(voice|speech|audio|whisper)/i, ["🎙️", "🔊", "🎧"]],
  [/\b(graph|network|node|edge)/i, ["🕸️", "🔗", "🧬"]],
  [/\b(data|dataset|pipeline|etl|table)/i, ["📦", "🧺", "🚰"]],
  [/\b(dashboard|chart|plot|visual|metric)/i, ["📊", "📈", "🗠"]],
  [/\b(game|play|puzzle|maze)/i, ["🎮", "🕹️", "🧸"]],
  [/\b(schedul|cron|time|clock|calendar)/i, ["⏰", "🗓️", "⌛"]],
  [/\b(map|geo|location|spatial)/i, ["🗺️", "📍", "🌍"]],
  [/\b(llm|gpt|language model|inference)/i, ["🤖", "💬", "🦜"]],
];

// Last-resort pool for repos matching no keyword at all, chosen
// deterministically by slug so the icon stays stable across renders.
const EMOJI_POOL = [
  "🌸", "🍃", "🌙", "⭐", "🐚", "🍄", "🪷", "🌷", "🦋", "🐝",
  "🌻", "🪴", "🫧", "🌿", "🕊️", "🍀", "🪶", "🎐", "🧿", "🪅",
];

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

// Every icon this repo could reasonably wear, most specific first: a keyword
// in the repo's NAME says what the project is about, so those rules outrank
// rules that only hit somewhere in the description.
function emojiCandidates(name: string, text: string, slug: string): string[] {
  const out: string[] = [];
  const readable = name.replace(/[-_]+/g, " ");
  for (const [re, es] of EMOJI_RULES) if (re.test(readable)) out.push(...es);
  for (const [re, es] of EMOJI_RULES) if (re.test(text)) out.push(...es);
  const start = hashSlug(slug);
  for (let i = 0; i < EMOJI_POOL.length; i++) out.push(EMOJI_POOL[(start + i) % EMOJI_POOL.length]);
  return [...new Set(out)];
}

// Ordered keyword rules: first match wins, so put the more specific ones first.
// First match wins, so unambiguous signals (crypto, agents) go first.
const RULES: [Category, RegExp][] = [
  ["Cybersecurity", /\b(security|malware|crypto|blockchain|cyber|encrypt|encryption|cipher|intrusion)/i],
  ["Internet of Things", /\b(iot|internet of things|sensor|arduino|raspberry ?pi|mqtt|embedded|smart home|edge device|wearable)/i],
  ["Agentic AI", /\b(agent|agentic|crew|autogen|multi-?agent|orchestrat)/i],
  ["High Performance Machine Learning", /\b(triton|cuda|gpu|quantiz|kv-?cache|hpc|kernel|inference-?opt|throughput)/i],
  ["Causal Inference", /\b(causal|counterfactual|treatment-?effect|mediation|confound)/i],
  ["Generative AI", /\b(rag|llm|gpt|generative|diffusion model|stable.?diffusion|dall|gemini|claude|chatbot|prompt|retrieval-?augmented|text-?to-)/i],
  ["Computer Vision", /\b(vision|cnn|resnet|vgg|yolo|segmentation|object detection|ocr|x-?ray|ct scan)/i],
  ["NLP", /\b(nlp|sentiment|language model|bert|tokeniz|summari|translation|fake news)/i],
  ["Statistical Modeling", /\b(statistic|shiny|\beda\b|distribution|hypothesis|bayesian|regression-?analysis)/i],
  // self-declared "machine learning" beats a stray "predict" in the prose
  ["Machine Learning", /\bmachine learning\b/i],
  ["Predictive Analysis", /\b(forecast|predict|churn|price|risk|demand|recommend)/i],
  ["Deep Learning", /\b(deep|neural|dnn|lstm|transformer|gan|autoencoder)/i],
];

export function categorize(text: string): Category {
  for (const [cat, re] of RULES) if (re.test(text)) return cat;
  return "Machine Learning";
}

// Every matching technical area (not just the first), ordered by rule priority
// and capped, so a project that is both IoT and Computer Vision shows both.
export function categorizeAll(text: string, max = 3): Category[] {
  const hits = RULES.filter(([, re]) => re.test(text)).map(([c]) => c);
  return hits.length ? hits.slice(0, max) : ["Machine Learning"];
}

const DOMAIN_RULES: [Domain, RegExp][] = [
  ["Healthcare", /\b(health|clinic|medical|patient|disease|cancer|cardio|diabet|x-?ray|scan|kidney|heart)/i],
  // note: no bare "learn" here, it false-matches "machine learning" everywhere
  ["Education", /\b(educat|course|tutor|student|study|exam|classroom|lecture)/i],
  ["Legal", /\b(legal|law|court|usc|precedent|contract)/i],
  ["Human Rights", /\b(human-?rights|welfare|child|refugee|equity)/i],
  ["Finance", /\b(finance|loan|price|stock|credit|bank|churn|revenue)/i],
  ["Cybersecurity", /\b(security|malware|crypto|blockchain|intrusion|encrypt)/i],
  ["Agriculture", /\b(plant|crop|agricultur|farm|soil)/i],
  ["Food & Nutrition", /\b(food|recipe|nutrition|diet|meal|cook|pantry)/i],
  ["Social Media", /\b(social|media|post|tweet|twitter|instagram|reddit|feed|influencer|content)/i],
  ["Public Sector", /\b(public|government|policy|civic|municipal)/i],
  ["Sports", /\b(sport|fitness|exercise|workout|athlet|gym|coach)/i],
];

export function detectDomains(text: string): Domain[] {
  return DOMAIN_RULES.filter(([, re]) => re.test(text)).map(([d]) => d);
}

function prettyName(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

interface GhRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  topics?: string[];
  language: string | null;
  fork: boolean;
}

/**
 * Curated projects (hand-written blurbs, featured) plus every other public repo
 * pulled live from GitHub, so new projects show up here on their own. Falls back
 * to just the curated list if GitHub is unreachable.
 */
export async function getAllProjects(): Promise<Project[]> {
  const curatedSlugs = new Set(
    curated.map((p) => p.repo.split("/").pop()!.toLowerCase()),
  );

  let repos: GhRepo[] = [];
  try {
    const res = await fetch(
      `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`,
      { headers: { Accept: "application/vnd.github+json" }, next: { revalidate: 3600 } },
    );
    if (res.ok) repos = (await res.json()) as GhRepo[];
  } catch {
    // offline / rate-limited: just show the curated list
  }

  const candsBySlug = new Map<string, string[]>();
  const extra: Project[] = repos
    .filter(
      (r) =>
        !r.fork &&
        r.name.toLowerCase() !== GH_USER &&
        !curatedSlugs.has(r.name.toLowerCase()),
    )
    .map((r) => {
      const text = `${r.name} ${r.description ?? ""} ${(r.topics ?? []).join(" ")} ${r.language ?? ""}`;
      const categories = categorizeAll(text);
      const tags = (r.topics?.length ? r.topics.slice(0, 4) : [r.language])
        .filter(Boolean)
        .map((t) => String(t));
      candsBySlug.set(r.name.toLowerCase(), emojiCandidates(r.name, text, r.name.toLowerCase()));
      return {
        name: prettyName(r.name),
        emoji: "✨", // placeholder, assigned from candidates below
        blurb: r.description || "A little experiment on GitHub ✦",
        categories,
        domains: detectDomains(text),
        repo: r.html_url,
        demo: r.homepage && /^https?:\/\//.test(r.homepage) ? r.homepage : undefined,
        tags,
      };
    });

  // Refresh curated projects from GitHub too: their blurb (description) and demo
  // (homepage) follow the repo live, with the hand-written values as fallback.
  // The curated name, emoji, categories, domains, tags, and featured flag stay.
  const repoBySlug = new Map(repos.map((r) => [r.name.toLowerCase(), r]));
  const validHomepage = (h: string | null) =>
    h && /^https?:\/\//.test(h) ? h : undefined;
  const mergedCurated: Project[] = curated.map((p) => {
    const r = repoBySlug.get(p.repo.split("/").pop()!.toLowerCase());
    if (!r) return p;
    return {
      ...p,
      // Blurb follows GitHub only for projects that opt in (syncBlurb), so the
      // hand-written blurbs with metrics aren't clobbered by a terse repo line.
      blurb: p.syncBlurb && r.description?.trim() ? r.description.trim() : p.blurb,
      // Demo link fills a gap from the GitHub homepage; a curated demo wins.
      demo: p.demo ?? validHomepage(r.homepage),
    };
  });

  // Her edits from /work/edit win over everything automatic; any field she
  // left empty falls back to the pipeline value above.
  const overrides = await readProjectOverrides();
  const applyOverride = (p: Project): Project => {
    const o = overrides[repoSlug(p.repo)];
    if (!o) return p;
    return {
      ...p,
      name: o.name ?? p.name,
      blurb: o.blurb ?? p.blurb,
      featured: o.featured ?? p.featured,
      categories: o.categories?.length ? o.categories : p.categories,
      domains: o.domains?.length ? o.domains : p.domains,
      tags: o.tags?.length ? o.tags : p.tags,
      results: o.results ?? p.results,
      article: o.article ?? p.article,
    };
  };

  // Keep the auto-pulled icons distinct AND meaningful: each project takes its
  // first candidate not already worn by a curated project (those are hand-set
  // and never move) or an earlier auto one. Because candidates are grouped by
  // theme, a collision slides to a related icon, not a random flower.
  const used = new Set(mergedCurated.map((p) => p.emoji));
  for (const p of extra) {
    const cands = candsBySlug.get(repoSlug(p.repo)) ?? [];
    p.emoji = cands.find((e) => !used.has(e)) ?? cands[0] ?? "🌸";
    used.add(p.emoji);
  }

  return [...mergedCurated, ...extra].map(applyOverride);
}
