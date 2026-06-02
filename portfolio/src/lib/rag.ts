import OpenAI from "openai";
import { buildKnowledge, type Chunk } from "@/lib/knowledge";

export interface Source {
  title: string;
  kind: string;
  href?: string;
}
export interface Answer {
  answer: string;
  sources: Source[];
}

export type StreamEvent =
  | { type: "sources"; sources: Source[] }
  | { type: "delta"; text: string }
  | { type: "followups"; items: string[] }
  | { type: "error" };

function normalize(v: number[]): number[] {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}
function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

// Embed the knowledge base once per server instance; re-embed if it changes.
let cache: { key: string; chunks: Chunk[]; vectors: number[][] } | null = null;

async function getCorpus(openai: OpenAI) {
  const chunks = await buildKnowledge();
  const key = chunks.map((c) => c.id).join("|");
  if (!cache || cache.key !== key) {
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: chunks.map((c) => `${c.title}. ${c.text}`),
    });
    cache = { key, chunks, vectors: emb.data.map((d) => normalize(d.embedding)) };
  }
  return cache;
}

const SYSTEM = `You are the friendly guide for Rishika Mamidibathula's portfolio website.
Answer visitor questions about Rishika using ONLY the context provided. The context is drawn from her real bio, education, work experience, research, and projects.
Rules:
- If the answer is not in the context, say you are not sure and gently suggest they reach out via the Contact page. Never invent facts, dates, employers, or numbers.
- Speak warmly and concisely, in third person about Rishika. Two to four sentences is usually plenty.
- Do not use em dashes or en dashes; use commas, colons, or separate sentences.
- You do not have access to her private poems or photos, so do not claim to.`;

// Retrieve the top-k chunks for a question and build the prompt context + sources.
async function retrieve(openai: OpenAI, question: string, k: number) {
  const { chunks, vectors } = await getCorpus(openai);
  const q = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: question,
  });
  const qv = normalize(q.data[0].embedding);
  const ranked = chunks
    .map((c, i) => ({ c, score: dot(qv, vectors[i]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
  const context = ranked
    .map((r, i) => `[${i + 1}] (${r.c.kind}) ${r.c.title}\n${r.c.text}`)
    .join("\n\n");
  const sources: Source[] = ranked.map((r) => ({
    title: r.c.title,
    kind: r.c.kind,
    href: r.c.href,
  }));
  return { context, sources };
}

// Suggest a few natural next questions a visitor might ask, grounded in the
// retrieved context and the answer just given.
async function suggestFollowups(
  openai: OpenAI,
  question: string,
  answer: string,
  context: string,
): Promise<string[]> {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Given a visitor's question about Rishika, the answer, and the context, propose 3 short, distinct follow-up questions the visitor would naturally ask next. Each under 8 words, answerable from a portfolio about her work, projects, research, or studies. Return JSON: {\"followups\": [\"...\", \"...\", \"...\"]}.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${question}\nAnswer: ${answer}`,
        },
      ],
    });
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
    const items = Array.isArray(parsed.followups) ? parsed.followups : [];
    return items.filter((x: unknown) => typeof x === "string").slice(0, 3);
  } catch {
    return [];
  }
}

// Streaming answer: yields sources first, then answer deltas, then follow-ups.
export async function* answerStream(question: string, k = 5): AsyncGenerator<StreamEvent> {
  const openai = new OpenAI();
  const { context, sources } = await retrieve(openai, question, k);
  yield { type: "sources", sources };

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    stream: true,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
    ],
  });

  let full = "";
  for await (const part of stream) {
    const delta = part.choices[0]?.delta?.content;
    if (delta) {
      full += delta;
      yield { type: "delta", text: delta };
    }
  }

  const items = await suggestFollowups(openai, question, full, context);
  yield { type: "followups", items };
}

// Non-streaming answer (used by the eval harness for a simple JSON response).
export async function answerQuestion(question: string, k = 5): Promise<Answer> {
  const openai = new OpenAI();
  const { context, sources } = await retrieve(openai, question, k);
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
    ],
  });
  const answer =
    completion.choices[0]?.message?.content?.trim() ??
    "I'm not sure about that one. The Contact page is the best way to reach Rishika directly. ✦";
  return { answer, sources };
}
