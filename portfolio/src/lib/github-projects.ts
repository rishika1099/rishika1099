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
  // security / privacy
  [/\b(encrypt|cipher|crypto|watermark|stylometr|firewall|anonymi|privacy)/i, ["🔐", "🗝️", "🕵️", "🛡️"]],
  [/\b(injection|jailbreak|adversarial|attack|exploit|malware|intrusion|surveillance)/i, ["🧨", "🚨", "🕷️", "⚠️"]],
  // safety / refusal / evaluation
  [/\b(refusal|over-?refus|safety|harm|guardrail|moderation)/i, ["🦺", "🧯", "⚖️", "🚧"]],
  [/\b(eval|benchmark|harness|regression test|leaderboard|test spec)/i, ["🧪", "📋", "🔬", "📐"]],
  [/\b(calibrat|confidence|uncertain|ambigu|humility|honest)/i, ["🎚️", "⚖️", "🌡️", "🎯"]],
  // agents
  [/\b(agent|agentic|crew|multi-?agent|orchestrat|deadlock|replay)/i, ["🤖", "🎭", "🕹️", "🧩"]],
  [/\b(planning|planner|budget-?aware|tool ?use)\b/i, ["🗺️", "📅", "🧮", "🎯"]],
  // llm serving / inference efficiency
  [/\b(gateway|proxy|load ?balanc|rate limit)/i, ["🚦", "🎛️", "🛂", "🚪"]],
  [/\b(router|routing|dispatch)/i, ["🧭", "🔀", "🛣️", "📍"]],
  [/\b(kv-?cache|cache|quantiz|compression|precision|throughput|latency|profil|speculative|early.?exit|token budget)/i, ["⚡", "🗃️", "🧊", "⏱️", "🪶"]],
  [/\b(energy|joule|watt|carbon footprint|energy-?efficien)/i, ["🔋", "⚡", "🌱", "♻️"]],
  [/\b(context.?window|long-?context|retrieval|rag|index|embed|vector)/i, ["🪟", "📚", "🔎", "🗂️"]],
  // reasoning / prompts / debugging
  [/\b(reason|chain-?of-?thought|self-?consistency|thinking)/i, ["💭", "🧠", "🧩", "🪞"]],
  [/\b(prompt|delta debugging|minimiz|repro|debug|failure|shortcut|bug)/i, ["🐛", "🔍", "✂️", "🩹"]],
  [/\b(structured output|json|schema|grammar|parse|format)/i, ["📐", "🧱", "📎", "🗒️"]],
  [/\b(provenance|citation|attribution|audit|ledger|lineage)/i, ["🧾", "🔗", "📜", "🗄️"]],
  // learning dynamics / data
  [/\b(memory|forget|retention|catastrophic|drift|decay|stale|retrain)/i, ["🧠", "🌊", "⏳", "🍂"]],
  [/\b(grokking|curriculum|training dynamic|scaling|small.?data|regime|learning curve)/i, ["📈", "🪜", "🌱", "🎼"]],
  [/\b(label|annotat|noise|preference|reward|human feedback|rlhf)/i, ["🏷️", "👍", "🎚️", "🗳️"]],
  [/\b(active learning|acquisition|sampling|budget)/i, ["🎣", "🪙", "🎯", "📊"]],
  [/\b(reinforcement|offline rl|\brl\b|policy|bandit|\bope\b)/i, ["🕹️", "🎮", "🎰", "🚀"]],
  [/\b(feature store|automl|pipeline|etl|dataset|data quality)/i, ["📦", "🧺", "🚰", "🏗️"]],
  [/\b(wildlife|camera.?trap|ecolog|species|biodivers)/i, ["🦌", "🐾", "🦉", "🌲"]],
  // causal / statistics
  [/\b(causal|counterfactual|treatment-?effect|mediation|confound|estimand|negative control|synthetic control|assumption)/i, ["🧬", "🔀", "⚗️", "🪢"]],
  [/\b(statistic|bayesian|hypothesis|distribution|correlation|measurement error)/i, ["📊", "📉", "🎲", "📏"]],
  [/\b(forecast|predict|churn|price|risk|demand|time.?series|weather)/i, ["🔮", "📈", "🌤️", "🧿"]],
  // vision / sensing / robotics
  [/\b(vision|image|photo|camera|ocr|segmentation|yolo|resnet|vgg|visual)/i, ["🖼️", "👁️", "📷", "🎨"]],
  [/\b(x-?ray|ct scan|mri|scan|medical imaging|retina|cataract|keratoconus|glaucoma)/i, ["🩻", "🔬", "👁️", "🩺"]],
  [/\b(grasp|robot|tactile|touch|manipulat|actuator)/i, ["🦾", "🤖", "✋", "🔧"]],
  [/\b(audio|sound|speech|voice|whisper|acoustic)/i, ["🎙️", "🔊", "🎧", "🎵"]],
  // language / text
  [/\b(nlp|sentiment|summari|translat|language model|bert|tokeniz|\bterm\b|lexic|arxiv)/i, ["💬", "📝", "🗣️", "📖"]],
  [/\b(fake news|misinformation|fact.?check|credibility)/i, ["📰", "🔍", "🚩", "📢"]],
  // domains
  [/\b(health|clinic|medical|patient|disease|cancer|cardio|diabet|kidney|heart)/i, ["🩺", "💊", "🫀", "🏥"]],
  [/\b(legal|law|court|usc|precedent|contract|compliance)/i, ["⚖️", "📜", "🏛️", "🗂️"]],
  [/\b(child|welfare|human-?rights|refugee|equity|fairness|bias)/i, ["🧸", "🤝", "🕊️", "⚖️"]],
  [/\b(finance|loan|stock|credit|bank|revenue|cost)/i, ["🏦", "💰", "📉", "🪙"]],
  [/\b(food|recipe|nutrition|diet|meal|cook|pantry|wine)/i, ["🍲", "🥗", "🍯", "🧑‍🍳"]],
  [/\b(plant|crop|agricultur|farm|soil|ocean|climate|earth)/i, ["🌾", "🌊", "🌍", "🪴"]],
  [/\b(course|student|educat|tutor|teach|exam|coach|skill)/i, ["🎓", "📚", "🧑‍🏫", "🍎"]],
  [/\b(sport|fitness|exercise|workout|athlet|gym)/i, ["🏅", "🏃", "🤸", "⚽"]],
  [/\b(traffic|road ?sign|vehicle|\bcar\b|driving|autonomous)/i, ["🚸", "🚗", "🛣️", "🚦"]],
  [/\b(iot|sensor|arduino|esp32|raspberry ?pi|mqtt|embedded|hardware)/i, ["📡", "🔌", "🛰️", "⚙️"]],
  [/\b(blockchain|ledger|distributed|consensus)/i, ["⛓️", "🧱", "🔗", "🗝️"]],
  // shape / structure / maps
  [/\b(museum|gallery|exhibit|archaeolog|archive)/i, ["🏛️", "🖼️", "🗿", "🏷️"]],
  [/\b(cartograph|atlas|map|landscape|topolog|cluster|taxonom)/i, ["🗺️", "📍", "🧿", "🗂️"]],
  [/\b(ladder|bucket|tier|staged|sweep|recompil|search space)/i, ["🪜", "🧗", "🎚️", "🗜️"]],
  [/\b(dashboard|chart|plot|visual|report|metric)/i, ["📊", "📈", "🗂️", "📋"]],
  // last, broad: anything explicitly LLM that none of the above caught
  [/\b(llm|gpt-|openai|anthropic|language model)/i, ["🦜", "✨", "🔮", "🧠"]],
];

// Genuine last resort, reached only by a repo whose words match no theme at
// all. Kept deliberately neutral: a nondescript object reads as "uncategorised"
// where a butterfly on a safety harness reads as a bug.
const EMOJI_POOL = [
  "🌸", "🍃", "🌙", "⭐", "🪄", "🧷", "🎏", "🪁", "🧩", "🔖",
  "🪺", "🧶", "🫧", "🌱", "🕊️", "🍀", "🪶", "🎐", "🧿", "🪅",
  "🌻", "🌺", "🌷", "🍄", "🌾", "🪴", "🌵", "🍁", "🐚", "🪸",
  "🦋", "🐌", "🐞", "🐝", "🦔", "🦭", "🐋", "🦩", "🦚", "🐧",
  "🍯", "🍓", "🫐", "🍋", "🍑", "🥐", "🧁", "🍡", "🍵", "🧋",
  "🎨", "🖌️", "🪕", "🎻", "🪗", "🎺", "🥁", "🎹", "🪈", "🎼",
  "🔭", "🧭", "⛵", "🎠", "🎡", "🏮", "🕯️", "🫖", "📎", "🪟",
  "🧵", "🪢", "🎀", "🪞", "🧸", "🪆", "🎪", "🗝️", "🪙", "🧊",
];

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

// Every icon this repo could reasonably wear, most specific first: a keyword
// in the repo's NAME says what the project is about, so those rules outrank
// rules that only hit somewhere in the description. Themed icons come first
// and the whimsical pool last, so the pool is only reached by a repo whose
// words match nothing at all.
function emojiCandidates(name: string, text: string, slug: string): {
  themed: string[];
  fallback: string[];
} {
  const themed: string[] = [];
  const readable = name.replace(/[-_]+/g, " ");
  for (const [re, es] of EMOJI_RULES) if (re.test(readable)) themed.push(...es);
  for (const [re, es] of EMOJI_RULES) if (re.test(text)) themed.push(...es);
  const start = hashSlug(slug);
  const fallback: string[] = [];
  for (let i = 0; i < EMOJI_POOL.length; i++) fallback.push(EMOJI_POOL[(start + i) % EMOJI_POOL.length]);
  return { themed: [...new Set(themed)], fallback };
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
// The repo list is external data that changes at GitHub's pace, so it is held
// for a few minutes per instance. Deliberately narrow: her own overrides are
// still read fresh on every request, because those are edits she expects to see
// the moment she saves, and caching them is what made /work look frozen before.
let repoCache: { at: number; repos: GhRepo[] } | null = null;
const REPO_TTL_MS = 5 * 60 * 1000;

// Whether the last repo fetch actually reached GitHub. Unauthenticated calls are
// capped at 60/hour per IP, so a cold instance can easily be handed nothing and
// fall back to the curated list alone. Callers that key a cache on the project
// set need to know the difference between "she has these projects" and "GitHub
// did not answer", or they cache a half list under its own key and pay to build
// it again the moment the full one comes back.
let reposComplete = false;
export const reposAreComplete = () => reposComplete;

async function fetchRepos(): Promise<GhRepo[]> {
  if (repoCache && Date.now() - repoCache.at < REPO_TTL_MS) return repoCache.repos;
  try {
    const res = await fetch(
      `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`,
      { headers: { Accept: "application/vnd.github+json" }, next: { revalidate: 3600 } },
    );
    if (res.ok) {
      const repos = (await res.json()) as GhRepo[];
      repoCache = { at: Date.now(), repos };
      reposComplete = true;
      return repos;
    }
  } catch {
    // offline / rate-limited: fall back to whatever we last saw, else curated only
  }
  if (repoCache) return repoCache.repos;
  reposComplete = false;
  return [];
}

export async function getAllProjects(): Promise<Project[]> {
  const curatedSlugs = new Set(
    curated.map((p) => p.repo.split("/").pop()!.toLowerCase()),
  );

  const repos = await fetchRepos();

  const candsBySlug = new Map<string, { themed: string[]; fallback: string[] }>();
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
      // a hand-picked emoji always wins over the keyword guess
      emoji: o.emoji || p.emoji,
    };
  };

  // Keep the auto-pulled icons distinct AND meaningful: each project takes its
  // first candidate not already worn by a curated project (those are hand-set
  // and never move) or an earlier auto one. Because candidates are grouped by
  // theme, a collision slides to a related icon, not a random flower.
  const used = new Set(mergedCurated.map((p) => p.emoji));
  for (const p of extra) {
    const c = candsBySlug.get(repoSlug(p.repo));
    const themed = c?.themed ?? [];
    const fallback = c?.fallback ?? [];
    // A themed icon first, and a distinct one always: two cards wearing the
    // same face read as the same project at a glance, which is worse than a
    // card wearing a slightly arbitrary one. Only if every icon in existence is
    // already taken does anything repeat.
    p.emoji =
      themed.find((e) => !used.has(e)) ??
      fallback.find((e) => !used.has(e)) ??
      (themed[0] ?? fallback[0] ?? "🌸");
    used.add(p.emoji);
  }

  return [
    ...mergedCurated.map((p) => ({ ...p, curated: true })),
    ...extra.map((p) => ({ ...p, curated: false })),
  ].map(applyOverride);
}
