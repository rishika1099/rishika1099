import { createHash } from "node:crypto";
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

// A prior conversation turn, so follow-ups like "can I see a demo of it?"
// keep their referent.
export interface Turn {
  role: "user" | "bot";
  text: string;
}

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
  // Keyed on what the chunks say, not on which ones exist. Keyed by id alone,
  // editing an About card or a project blurb changed nothing the bot could
  // see: the set of ids was identical, so the cached text and vectors were
  // kept and the edit did not reach it until a card was added or renamed.
  const key = createHash("sha1")
    .update(chunks.map((c) => `${c.id}\u0000${c.title}\u0000${c.text}`).join("|"))
    .digest("hex");
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

// The date the answer is being given on, stated rather than left for the model
// to assume. Without it the bot has no way to tell what is current: asked about
// her teaching it said she "will be" the TA for a course she was teaching that
// very semester, because "Fall 2026" reads as the future to a model that does
// not know it is autumn 2026. Computed per request, not once at module load.
function systemPrompt(now = new Date()): string {
  const today = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
  return `${SYSTEM}
- Today is ${today}. Use it to tell present from past. A role running to "present" is current. Semesters are Spring (January to May), Summer (June to August) and Fall (September to December), and one is current only if today falls inside it: otherwise it has finished or has not started. Describe what is current in the present tense and what has finished in the past tense.`;
}

// Follow-up questions often lean on pronouns ("a demo of it?"), so retrieval
// embeds a little recent conversation alongside the question to keep the
// referent, while the raw question still goes to the model as-is.
function retrievalText(question: string, history: Turn[]): string {
  if (!history.length) return question;
  const recent = history.slice(-4);
  const lastUser = [...recent].reverse().find((t) => t.role === "user")?.text ?? "";
  const lastBot = [...recent].reverse().find((t) => t.role === "bot")?.text ?? "";
  return [lastUser, lastBot.slice(0, 300), question].filter(Boolean).join("\n");
}

// Semester months, zero-based: Spring Jan to May, Summer Jun to Aug, Fall Sep to Dec.
const TERMS: Record<string, [number, number]> = { spring: [0, 4], summer: [5, 7], fall: [8, 11] };

/**
 * Label each semester in a passage with whether it is happening now.
 *
 * Telling the model the date was not enough. Given "Spring 2026" and "Fall
 * 2026" on a September morning, it said three times out of three that she was
 * currently teaching the finished spring course and would be teaching the one
 * she was in the middle of. A semester name is the one date form on the site
 * that needs arithmetic to place, and the model does not do it reliably, so it
 * is done here instead and the answer is handed over as a word.
 *
 * Applied as the context is assembled, per question, and deliberately not when
 * the index is built: the index is cached for as long as the server instance
 * lives, so a status baked in there would still say "current" after the
 * semester had ended.
 */
function withTermStatus(text: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value) - 1;
  const today = year * 12 + month;
  return text.replace(/\b(Spring|Summer|Fall) (\d{4})\b/g, (whole, term: string, y: string) => {
    const [from, to] = TERMS[term.toLowerCase()];
    const status =
      today < Number(y) * 12 + from ? "upcoming" : today > Number(y) * 12 + to ? "finished" : "current";
    return `${whole}, ${status} semester`;
  });
}

// Retrieve the top-k chunks for a question and build the prompt context + sources.
async function retrieve(openai: OpenAI, question: string, k: number, history: Turn[] = []) {
  const { chunks, vectors } = await getCorpus(openai);
  const q = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: retrievalText(question, history),
  });
  const qv = normalize(q.data[0].embedding);
  const ranked = chunks
    .map((c, i) => ({ c, score: dot(qv, vectors[i]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
  const context = ranked
    .map((r, i) => `[${i + 1}] (${r.c.kind}) ${r.c.title}\n${withTermStatus(r.c.text)}`)
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
            "Propose up to 3 short follow-up questions for a portfolio chatbot. STRICT RULE: only suggest questions whose answer is explicitly and specifically present in the CONTEXT below, so the bot can actually answer them. Do NOT suggest questions about challenges, motivations, feelings, opinions, or any detail not stated in the context. Prefer concrete facts that appear in the context (a named project, tech, role, school, timeframe). Each under 8 words, distinct. If fewer than 3 are well-supported, return fewer. Return JSON: {\"followups\": [\"...\"]}.",
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

// Recent turns as chat messages so the model can resolve "it"/"that project".
function historyMessages(history: Turn[]) {
  return history.slice(-6).map((t) => ({
    role: t.role === "bot" ? ("assistant" as const) : ("user" as const),
    content: t.text.slice(0, 600),
  }));
}

// Streaming answer: yields sources first, then answer deltas, then follow-ups.
export async function* answerStream(
  question: string,
  history: Turn[] = [],
  k = 5,
): AsyncGenerator<StreamEvent> {
  const openai = new OpenAI();
  const { context, sources } = await retrieve(openai, question, k, history);
  yield { type: "sources", sources };

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt() },
      ...historyMessages(history),
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
export async function answerQuestion(
  question: string,
  history: Turn[] = [],
  k = 5,
): Promise<Answer> {
  const openai = new OpenAI();
  const { context, sources } = await retrieve(openai, question, k, history);
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: systemPrompt() },
      ...historyMessages(history),
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
    ],
  });
  const answer =
    completion.choices[0]?.message?.content?.trim() ??
    "I'm not sure about that one. The Contact page is the best way to reach Rishika directly. ✦";
  return { answer, sources };
}
