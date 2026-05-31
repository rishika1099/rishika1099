"use client";

import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";

const timeline = [
  {
    icon: "🗽",
    when: "Summer 2026",
    role: "Data Science Intern",
    place: "NYC Administration for Children's Services",
    note: "Predictive risk models on child-welfare data with explainable ML, fairness auditing, and causal adjustment for high-stakes public-sector decisions.",
  },
  {
    icon: "🏥",
    when: "Jan 2026 – Present",
    role: "Research Assistant — Clinical LLM & Phenotyping",
    place: "Columbia University Irving Medical Center",
    note: "Built an extraction system with hybrid regex/LLM de-identification, longitudinal EHR reconstruction, and hallucination-aware validation into 56 cardiac-sarcoidosis phenotype variables.",
  },
  {
    icon: "⚖️",
    when: "Jan 2026 – Present",
    role: "Research Assistant — Human Rights LLM Evaluation",
    place: "Columbia GSAS",
    note: "A retrieval-augmented LLM evaluation framework producing explainable human-rights due-diligence scores across 27 defense manufacturers, cutting manual review 80%.",
  },
  {
    icon: "🐚",
    when: "2023 – 2025",
    role: "Software Engineer",
    place: "Shell, Bengaluru",
    note: "ML forecasting in Databricks across 12 business units — 23% lower forecast error, $100K+ savings, and RPA bots that cut manual reporting 85%.",
  },
  {
    icon: "💊",
    when: "Jan – Jul 2023",
    role: "Technical Analyst Intern",
    place: "Novartis, Hyderabad",
    note: "NLP workflow for clinical-trial sentiment mining & summarization, plus time-series pipelines supporting a 19% carbon-reduction goal.",
  },
];

const education = [
  {
    icon: "🦁",
    when: "2025 – present",
    degree: "M.S. in Data Science",
    place: "Columbia University, New York",
    note: "GPA 3.87 — focus on machine learning, LLM systems, and causal inference.",
  },
  {
    icon: "🎓",
    when: "2019 – 2023",
    degree: "B.Tech, Computer Science & Data Science",
    place: "Vellore Institute of Technology (VIT)",
    note: "4.0/4.0 GPA · graduated ranked 7th of 200.",
  },
];

const skills = [
  "Python", "PyTorch", "TensorFlow", "scikit-learn", "FastAPI", "SQL", "R", "C++",
  "RAG", "LangChain", "Hugging Face", "ChromaDB", "FAISS", "Multimodal AI",
  "Databricks", "PySpark", "MongoDB", "BigQuery", "Redis", "Docker",
  "AWS", "Azure", "Weights & Biases", "CI/CD",
];

export default function About() {
  return (
    <PageShell vibe="cozy">
      <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">
        the human behind the models 🍵
      </h1>

      <div className="mt-6 max-w-2xl space-y-4 font-body text-lg text-ink-soft">
        <p>
          I&apos;m Rishika — an M.S. Data Science student at{" "}
          <strong className="text-ink">Columbia University</strong> (GPA 3.87),
          and before that I topped my B.Tech in CS &amp; Data Science at VIT
          (4.0/4.0, ranked 7th of 200). I like problems where careful modeling
          actually changes a decision — healthcare, public policy, fairness.
        </p>
        <p>
          By day I build LLM systems, causal models, and ML pipelines. By night
          I write poems, take photographs, and tinker with little apps for the
          joy of it. This site is where all of that lives together.
        </p>
      </div>

      {/* Education */}
      <h2 className="mt-12 font-display text-2xl font-semibold text-ink">
        where I studied 🎓
      </h2>
      <div className="mt-5 space-y-4">
        {education.map((e, i) => (
          <motion.div
            key={e.degree}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.06 }}
            className="flex gap-4 rounded-3xl p-5 soft-card"
          >
            <span className="animate-float-med text-3xl">{e.icon}</span>
            <div>
              <p className="font-serif text-base italic text-ink-soft">
                {e.when}
              </p>
              <h3 className="font-display text-lg font-semibold text-ink">
                {e.degree}
              </h3>
              <p className="font-body text-sm font-semibold text-ink-soft">
                {e.place}
              </p>
              <p className="mt-1 font-body text-sm text-ink-soft">{e.note}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Skills */}
      <h2 className="mt-12 font-display text-2xl font-semibold text-ink">
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
      <h2 className="mt-12 font-display text-2xl font-semibold text-ink">
        where I&apos;ve been
      </h2>
      <div className="mt-5 space-y-4">
        {timeline.map((t, i) => (
          <motion.div
            key={t.role}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.06 }}
            className="flex gap-4 rounded-3xl p-5 soft-card"
          >
            <span className="animate-float-med text-3xl">{t.icon}</span>
            <div>
              <p className="font-serif text-base italic text-ink-soft">
                {t.when}
              </p>
              <h3 className="font-display text-lg font-semibold text-ink">
                {t.role}
              </h3>
              <p className="font-body text-sm font-semibold text-ink-soft">
                {t.place}
              </p>
              <p className="mt-1 font-body text-sm text-ink-soft">{t.note}</p>
            </div>
          </motion.div>
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
