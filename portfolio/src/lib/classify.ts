// Embedding zero-shot classifier for blog posts. Instead of first-match keyword
// rules (which a stray word can hijack), we embed the post and each label's
// description with OpenAI, then rank every label by cosine similarity.
//
// - tech category: the single closest category (argmax), which is reliably the
//   real topic in testing.
// - domains: assigned only when one domain is BOTH above a floor AND clearly
//   ahead of the runner-up, so ambiguous / spurious matches are dropped. Most
//   methodology posts get no domain, which is correct.
//
// Label prototypes are multi-phrase and averaged, which denoises the vectors.
// Prototype embeddings are cached per server instance; posts are embedded in a
// single batched call per classify request.

import OpenAI from "openai";
import { type Category, type Domain } from "@/data/projects";

const CATEGORY_PROTOS: Record<Category, string[]> = {
  "Generative AI": [
    "large language models and RAG retrieval",
    "prompting chatbots and text generation",
    "diffusion models that generate images",
  ],
  "Agentic AI": [
    "autonomous AI agents using tools",
    "multi-agent orchestration and planning",
    "agents that take actions in a loop",
  ],
  NLP: [
    "natural language processing of text",
    "sentiment analysis and summarization",
    "tokenization, translation, language understanding",
  ],
  "Causal Inference": [
    "causal inference and causality",
    "counterfactuals, treatment effects, confounders",
    "why prediction is not the same as causation",
  ],
  "Statistical Modeling": [
    "classical statistics and probability",
    "hypothesis testing and Bayesian methods",
    "regression analysis and distributions",
  ],
  "Machine Learning": [
    "general machine learning fundamentals",
    "the end to end ML pipeline from scratch",
    "training and evaluating a model on data",
  ],
  "Predictive Analysis": [
    "predictive analytics and forecasting",
    "churn, demand, pricing, and risk scoring",
    "recommendation systems",
  ],
  "Deep Learning": [
    "deep neural networks and backpropagation",
    "CNNs, RNNs, LSTMs and transformers",
    "training deep learning architectures",
    "transfer learning and fine-tuning pretrained models like VGG or ResNet",
    "convolutional networks for image classification",
  ],
  "Computer Vision": [
    "computer vision and image analysis",
    "object detection and segmentation",
    "recognizing objects in images and scans",
  ],
  "High Performance Machine Learning": [
    "high performance ML and GPU kernels",
    "CUDA, Triton, quantization, KV cache",
    "inference optimization, throughput, serving efficiency",
  ],
  Cybersecurity: [
    "cybersecurity and protecting data",
    "encryption, ciphers, and cryptography",
    "malware and intrusion detection",
  ],
  "Internet of Things": [
    "internet of things and sensors",
    "embedded devices, Arduino, Raspberry Pi",
    "edge devices, wearables, smart home",
  ],
};

const DOMAIN_PROTOS: Record<Domain, string[]> = {
  Healthcare: [
    "medicine and clinical care",
    "cancer trials, patients, and disease diagnosis",
    "hospitals, doctors, and medical treatment",
    "medical imaging, CT scans, MRI, and radiology",
    "clinical notes, diagnosis, and patient data",
  ],
  Education: [
    "teaching and classroom learning",
    "courses, students, and tutoring",
    "studying a subject in school or university",
  ],
  "Public Sector": [
    "government and public policy",
    "civic and municipal services",
    "the public sector and governance",
  ],
  Legal: [
    "law, courts, and judges",
    "legal contracts and litigation",
    "attorneys, lawsuits, and legal precedent",
  ],
  "Human Rights": [
    "human rights and social justice",
    "refugees, welfare, and equity",
    "advocacy for vulnerable people",
  ],
  Finance: [
    "banking and financial markets",
    "loans, stocks, and credit",
    "revenue, money, and investing",
  ],
  Cybersecurity: [
    "information security and protecting data",
    "encryption and securing systems",
    "defending against cyber attacks",
  ],
  Agriculture: [
    "farming and crops",
    "soil, plants, and agriculture",
    "growing food on farms",
  ],
  "Food & Nutrition": [
    "recipes and cooking",
    "nutrition, diet, and meals",
    "food and eating",
  ],
  "Social Media": [
    "social media platforms and feeds",
    "tweets, posts, and influencers",
    "online social content and networks",
  ],
  Sports: [
    "sports and athletics",
    "fitness, exercise, and workouts",
    "coaching athletes and games",
  ],
};

// Calibrated against the current Substack posts. The tech floor only guards
// against a post with no real ML topic; the domain floor + margin keep domain
// tags precise (a domain must clearly clear the floor AND beat the runner-up,
// so ambiguous or incidental matches get no domain rather than a wrong one).
const TECH_FLOOR = 0.2;
const DOM_FLOOR = 0.31;
const DOM_MARGIN = 0.07;

function normalize(v: number[]): number[] {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}
function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
function average(vs: number[][]): number[] {
  const out = new Array(vs[0].length).fill(0);
  for (const v of vs) for (let i = 0; i < v.length; i++) out[i] += v[i];
  return normalize(out.map((x) => x / vs.length));
}

export interface Tags {
  category: Category;
  domains: Domain[];
}

let protoCache: { cats: [Category, number[]][]; doms: [Domain, number[]][] } | null = null;

async function ensureProtos(openai: OpenAI) {
  if (protoCache) return protoCache;
  const catKeys = Object.keys(CATEGORY_PROTOS) as Category[];
  const domKeys = Object.keys(DOMAIN_PROTOS) as Domain[];
  const flat = [
    ...catKeys.flatMap((k) => CATEGORY_PROTOS[k]),
    ...domKeys.flatMap((k) => DOMAIN_PROTOS[k]),
  ];
  const emb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: flat,
  });
  const vecs = emb.data.map((d) => normalize(d.embedding));
  let i = 0;
  const cats = catKeys.map((k) => {
    const n = CATEGORY_PROTOS[k].length;
    const v = average(vecs.slice(i, i + n));
    i += n;
    return [k, v] as [Category, number[]];
  });
  const doms = domKeys.map((k) => {
    const n = DOMAIN_PROTOS[k].length;
    const v = average(vecs.slice(i, i + n));
    i += n;
    return [k, v] as [Domain, number[]];
  });
  protoCache = { cats, doms };
  return protoCache;
}

/**
 * Classify each text into one tech category + zero-or-one domain by cosine
 * similarity to label prototypes. One batched embedding call for all texts.
 */
export async function classifyTexts(texts: string[]): Promise<Tags[]> {
  if (texts.length === 0) return [];
  const openai = new OpenAI();
  const { cats, doms } = await ensureProtos(openai);
  const emb = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return emb.data.map((d) => {
    const p = normalize(d.embedding);
    const cs = cats
      .map(([c, v]) => [dot(p, v), c] as [number, Category])
      .sort((a, b) => b[0] - a[0]);
    const category = cs[0][0] >= TECH_FLOOR ? cs[0][1] : "Machine Learning";

    const ds = doms
      .map(([dn, v]) => [dot(p, v), dn] as [number, Domain])
      .sort((a, b) => b[0] - a[0]);
    const domains =
      ds[0][0] >= DOM_FLOOR && (ds.length < 2 || ds[0][0] - ds[1][0] >= DOM_MARGIN)
        ? [ds[0][1]]
        : [];

    return { category, domains };
  });
}
