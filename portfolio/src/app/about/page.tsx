"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";

type Entry = {
  icon: string;
  when: string;
  title: string;
  place: string;
  note: string;
  // extra highlights revealed when the card is clicked, add as many as you like
  details?: string[];
};

const timeline: Entry[] = [
  {
    icon: "🗽",
    when: "Summer 2026",
    title: "Data Science Intern",
    place: "NYC Administration for Children's Services",
    note: "Predictive risk models on child-welfare data with explainable ML, fairness auditing, and causal adjustment for high-stakes public-sector decisions.",
    details: [
      "Explainable ML on sensitive child-welfare data.",
      "Fairness auditing baked into every model.",
      "Causal adjustment for high-stakes public-sector decisions.",
    ],
  },
  {
    icon: "🏥",
    when: "Jan 2026 – Present",
    title: "Research Assistant: Clinical LLM & Phenotyping",
    place: "Columbia University Irving Medical Center",
    note: "Built an extraction system for cardiac-sarcoidosis phenotyping from clinical notes.",
    details: [
      "Hybrid regex/LLM de-identification pipeline for protected health data.",
      "Longitudinal EHR reconstruction across fragmented patient records.",
      "Hallucination-aware validation into 56 phenotype variables.",
    ],
  },
  {
    icon: "⚖️",
    when: "Jan 2026 – Present",
    title: "Research Assistant: Human Rights LLM Evaluation",
    place: "Columbia GSAS",
    note: "A retrieval-augmented LLM framework for explainable human-rights due-diligence scoring.",
    details: [
      "Scored 27 defense manufacturers on human-rights due-diligence.",
      "Cut manual review effort by ~80% with RAG-backed evidence retrieval.",
    ],
  },
  {
    icon: "🐚",
    when: "2023 – 2025",
    title: "Software Engineer",
    place: "Shell, Bengaluru",
    note: "ML forecasting in Databricks across 12 business units.",
    details: [
      "23% lower forecast error across 12 business units.",
      "$100K+ in operational savings.",
      "RPA bots that cut manual reporting effort by 85%.",
    ],
  },
  {
    icon: "💊",
    when: "Jan – Jul 2023",
    title: "Technical Analyst Intern",
    place: "Novartis, Hyderabad",
    note: "NLP workflow for clinical-trial sentiment mining and summarization, plus time-series pipelines supporting a 19% carbon-reduction goal.",
    details: [
      "NLP for clinical-trial sentiment mining and summarization.",
      "Time-series pipelines supporting a 19% carbon-reduction goal.",
    ],
  },
];

const education: Entry[] = [
  {
    icon: "🦁",
    when: "2025 – present",
    title: "M.S. in Data Science",
    place: "Columbia University, New York",
    note: "GPA 3.87, focus on machine learning, LLM systems, and causal inference.",
    details: [
      "Graduate coursework in deep learning, NLP, and causal inference.",
      "Research assistant in clinical NLP and human-rights LLM evaluation.",
    ],
  },
  {
    icon: "🎓",
    when: "2019 – 2023",
    title: "B.Tech, Computer Science & Data Science",
    place: "Vellore Institute of Technology (VIT)",
    note: "4.0/4.0 GPA · graduated ranked 7th of 200.",
    details: [
      "Perfect 4.0/4.0 GPA, ranked 7th of 200.",
      "Early ML and data-science research that set the whole path in motion.",
    ],
  },
];

const skills = [
  "Python", "PyTorch", "TensorFlow", "scikit-learn", "FastAPI", "SQL", "R", "C++",
  "RAG", "LangChain", "Hugging Face", "ChromaDB", "FAISS", "Multimodal AI",
  "Databricks", "PySpark", "MongoDB", "BigQuery", "Redis", "Docker",
  "AWS", "Azure", "Weights & Biases", "CI/CD",
];

function EntryCard({ entry, i }: { entry: Entry; i: number }) {
  const [open, setOpen] = useState(false);
  const hasDetails = !!entry.details?.length;
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: i * 0.06 }}
      className="rounded-3xl p-5 soft-card"
    >
      <button
        type="button"
        onClick={() => hasDetails && setOpen((o) => !o)}
        aria-expanded={hasDetails ? open : undefined}
        className={`flex w-full gap-4 text-left ${
          hasDetails ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <span className="animate-float-med text-3xl">{entry.icon}</span>
        <div className="flex-1">
          <p className="font-body text-sm italic text-ink-soft">{entry.when}</p>
          <h3 className="font-body text-lg font-bold text-ink">
            {entry.title}
          </h3>
          <p className="font-body text-sm font-semibold text-ink-soft">
            {entry.place}
          </p>
          <p className="mt-1 font-body text-sm text-ink-soft">{entry.note}</p>
        </div>
        {hasDetails && (
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1 select-none font-body text-lg leading-none text-ink-soft"
            aria-hidden
          >
            ⌄
          </motion.span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && hasDetails && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="ml-[3.25rem] overflow-hidden"
          >
            {entry.details!.map((d) => (
              <li
                key={d}
                className="mt-2 flex gap-2 font-body text-sm text-ink-soft"
              >
                <span aria-hidden className="text-blush">✦</span>
                <span>{d}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function About() {
  return (
    <PageShell vibe="cozy">
      <PageTitle>the human behind the models 🍵</PageTitle>

      <div className="mt-6 max-w-2xl space-y-4 font-body text-lg text-ink-soft">
        <p>
          I&apos;m Rishika, an M.S. Data Science student at{" "}
          <strong className="text-ink">Columbia University</strong> (GPA 3.87),
          and before that I topped my B.Tech in CS &amp; Data Science at VIT
          (4.0/4.0, ranked 7th of 200). I like problems where careful modeling
          actually changes a decision: healthcare, public policy, fairness.
        </p>
        <p>
          By day I build LLM systems, causal models, and ML pipelines. By night
          I write poems, take photographs, and tinker with little apps for the
          joy of it. This site is where all of that lives together.
        </p>
      </div>

      {/* Education */}
      <h2 className="mt-12 font-body text-2xl font-bold text-ink">
        where I studied 🎓
      </h2>
      <div className="mt-5 space-y-4">
        {education.map((e, i) => (
          <EntryCard key={e.title} entry={e} i={i} />
        ))}
      </div>

      {/* Skills */}
      <h2 className="mt-12 font-body text-2xl font-bold text-ink">
        things I tinker with
      </h2>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {skills.map((s, i) => (
          <motion.span
            key={s}
            whileHover={{ rotate: i % 2 ? 6 : -6, scale: 1.08 }}
            className="cursor-default rounded-full bg-white/70 px-3.5 py-1.5 font-body text-sm font-semibold text-ink shadow-sm"
          >
            {s}
          </motion.span>
        ))}
      </div>

      {/* Timeline */}
      <h2 className="mt-12 font-body text-2xl font-bold text-ink">
        where I&apos;ve been
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        tap a card to unfold the details ✦
      </p>
      <div className="mt-5 space-y-4">
        {timeline.map((t, i) => (
          <EntryCard key={t.title} entry={t} i={i} />
        ))}
      </div>

      <div className="mt-10">
        <a
          href="/Rishika_Resume.pdf"
          className="inline-flex items-center gap-2 rounded-full bg-blush/80 px-6 py-3 font-display font-semibold text-ink transition hover:scale-105"
        >
          📄 peek at my résumé
        </a>
      </div>
    </PageShell>
  );
}
