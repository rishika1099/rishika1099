import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";

export const metadata: Metadata = {
  title: "Now",
  description: "What Rishika is working on, learning, and enjoying right now.",
};

// Edit these freely, this page is meant to stay current.
const sections: { emoji: string; title: string; items: string[] }[] = [
  {
    emoji: "🌱",
    title: "working on",
    items: [
      "Data Science Intern at NYC Administration for Children's Services: explainable risk models with fairness auditing for child-welfare decisions.",
      "Research at Columbia Irving Medical Center: an LLM pipeline that turns messy clinical notes into structured, research-ready data.",
      "Research at Columbia GSAS: an LLM framework that scores defense manufacturers on human-rights due diligence.",
    ],
  },
  {
    emoji: "📚",
    title: "learning",
    items: [
      "M.S. in Data Science at Columbia: deep learning, LLM systems, causal inference, and high-performance ML.",
      "Making LLM systems measurable: evals, grounding, and honest confidence.",
    ],
  },
  {
    emoji: "🛠️",
    title: "tinkering",
    items: [
      "This site! Latest experiments: an embedding zero-shot blog tagger, an eval dashboard, and tiny privacy-friendly analytics.",
      "Writing technical deep-dives on Substack (KV-cache optimization, causation vs prediction, image encryption).",
    ],
  },
  {
    emoji: "🍵",
    title: "off the clock",
    items: [
      "Writing poems (they live behind a little locked door on this site).",
      "Chasing good light around New York with my camera.",
      "Too much chai. No regrets.",
    ],
  },
];

const tools = [
  "Python",
  "PyTorch",
  "SQL",
  "Databricks",
  "OpenAI API",
  "Next.js",
  "TypeScript",
  "Tableau",
];

export default function NowPage() {
  return (
    <PageShell vibe="dawn">
      <PageTitle>what i&apos;m up to, now 🧭</PageTitle>
      <p className="mt-3 max-w-2xl font-body text-lg text-ink-soft">
        a living snapshot, inspired by the{" "}
        <a
          href="https://nownownow.com/about"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[#c77dba] underline hover:text-ink"
        >
          /now page
        </a>{" "}
        idea. last tended: June 2026 ✦
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <section key={s.title} className="rounded-3xl p-6 soft-card">
            <h2 className="font-body text-lg font-bold text-ink">
              <span className="mr-2">{s.emoji}</span>
              {s.title}
            </h2>
            <ul className="mt-3 space-y-2">
              {s.items.map((it) => (
                <li key={it} className="flex gap-2 font-body text-sm text-ink-soft">
                  <span aria-hidden className="text-blush">✦</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <h2 className="mt-10 font-body text-lg font-bold text-ink">🧰 tools i reach for daily</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {tools.map((t) => (
          <span
            key={t}
            className="rounded-full bg-white/70 px-3.5 py-1 font-body text-sm font-semibold text-ink-soft"
          >
            {t}
          </span>
        ))}
      </div>
    </PageShell>
  );
}
