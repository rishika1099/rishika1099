import { projects as curated, type Category, type Domain, type Project } from "@/data/projects";

const GH_USER = "rishika1099";

const CATEGORY_EMOJI: Record<Category, string> = {
  "Generative AI": "✨",
  "Agentic AI": "🤖",
  NLP: "💬",
  "Causal Inference": "🧬",
  "Statistical Modeling": "📈",
  "Machine Learning": "🌼",
  "Predictive Analysis": "🔮",
  "Deep Learning": "🧠",
  "Computer Vision": "👁️",
  "High Performance Machine Learning": "⚡",
  Cybersecurity: "🔐",
  "Internet of Things": "📡",
};

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
  ["Predictive Analysis", /\b(forecast|predict|churn|price|risk|demand|recommend)/i],
  ["Deep Learning", /\b(deep|neural|dnn|lstm|transformer|gan|autoencoder)/i],
];

function categorize(text: string): Category {
  for (const [cat, re] of RULES) if (re.test(text)) return cat;
  return "Machine Learning";
}

const DOMAIN_RULES: [Domain, RegExp][] = [
  ["Healthcare", /\b(health|clinic|medical|patient|disease|cancer|cardio|diabet|x-?ray|scan|kidney|heart)/i],
  ["Education", /\b(educat|course|tutor|student|learn|study|exam)/i],
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

function detectDomains(text: string): Domain[] {
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

  const extra: Project[] = repos
    .filter(
      (r) =>
        !r.fork &&
        r.name.toLowerCase() !== GH_USER &&
        !curatedSlugs.has(r.name.toLowerCase()),
    )
    .map((r) => {
      const text = `${r.name} ${r.description ?? ""} ${(r.topics ?? []).join(" ")} ${r.language ?? ""}`;
      const category = categorize(text);
      const tags = (r.topics?.length ? r.topics.slice(0, 4) : [r.language])
        .filter(Boolean)
        .map((t) => String(t));
      return {
        name: prettyName(r.name),
        emoji: CATEGORY_EMOJI[category],
        blurb: r.description || "A little experiment on GitHub ✦",
        categories: [category],
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

  return [...mergedCurated, ...extra];
}
