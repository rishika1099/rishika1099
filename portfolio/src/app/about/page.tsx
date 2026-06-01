"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import SkillGraph from "@/components/SkillGraph";

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
    note: "An LLM pipeline that turns messy longitudinal EHR notes into a 56-field structured phenotype, with HIPAA-safe de-identification and clinician-validated accuracy.",
    details: [
      "118-patient cardiac-sarcoidosis cohort at NYP/Columbia (IRB AAAV0341); 50K+ cardiology and rheumatology progress notes.",
      "Reconstructed fragmented Epic notes by grouping on (EMPI, NOTE_CSN_ID) and concatenating chronologically with visit-level delimiters, so the model could reason over LVEF trends and multi-year medication histories.",
      "Two-pass, HIPAA-safe de-identification: header-anchored regex plus a GPT-4.1-mini fallback (temp 0, JSON) for name / DOB / MRN; PHI swapped for opaque per-patient placeholders with the mapping held in memory only (no PHI ever written to disk).",
      "GPT-4.1 structured extraction into 56 phenotype fields (ECG, echo, cardiac MRI, FDG PET-CT, histopathology, labs, immunosuppressive therapy with start/stop dates) at temperature 0 with json_object output.",
      "Four anti-hallucination directives: extract only stated facts, never infer from context, return Unknown / null when a field is absent.",
      "Long-context two-pass extraction for the 23 patients over 120K tokens (tiktoken o200k_base) with field-aware merging; adaptive max_tokens (8K to 16K) and exponential-backoff retries.",
      "Cross-patient contamination check (0 leaks across 118 patients) and a 3-sheet Excel audit trail; validated against blinded dual-clinician chart review on a 10-patient sample.",
      "Built in Python 3.11 with pandas, the OpenAI client, tiktoken, and openpyxl.",
    ],
  },
  {
    icon: "⚖️",
    when: "Jan 2026 – Present",
    title: "Research Assistant: Human Rights LLM Evaluation",
    place: "Columbia GSAS",
    note: "A retrieval-augmented, two-model LLM framework that scores defense manufacturers on human-rights due diligence and validates itself against expert human raters.",
    details: [
      "Automated Human Rights Due Diligence scoring for 27 defense manufacturers, grounded in the UN Guiding Principles (15-24), UNICEF CRBP, the ABA defense-industry guidance, the UN Six Grave Violations, and Arms Trade Treaty Art. 7.4.",
      "9 dimensions on a 0-3 rubric: 5 HRDD lifecycle stages (policy commitment, risk assessment, prevention and mitigation, end-use monitoring, investigation and remediation) plus 4 children's-rights sub-dimensions.",
      "Hybrid two-stage pipeline: Claude Haiku with web search pulls direct quotes and source URLs from company policy documents when the on-file evidence is sparse; Claude Sonnet then scores with chain-of-thought that maps each quote to the rubric.",
      "Anti-hallucination by design: research and scoring run as separate API calls so the scorer cannot fabricate evidence, the researcher must return 'NOT FOUND' rather than invent, and every source is logged for manual verification.",
      "Inter-rater reliability against 12 previously human-scored companies: Cohen's weighted kappa (linear and quadratic), Krippendorff's alpha, Spearman rank correlation, per-dimension MAE, exact / within-1 agreement, and a confusion matrix.",
      "Styled 5-sheet Excel output (0-3 heatmap, human-vs-AI diff, reliability metrics, full reasoning, research audit) with Anthropic rate-limit handling and exponential backoff.",
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
          I&apos;m Rishika, a Data Science master&apos;s student at{" "}
          <strong className="text-ink">Columbia University</strong>. I spend my
          days building models, asking questions, and staring at plots until they
          either reveal something useful or make me question my life choices.
        </p>
        <p>
          I&apos;m interested in machine learning, LLM systems, causal inference,
          and using data to understand complex problems in healthcare, public
          policy, and beyond. Before Columbia, I studied Computer Science and
          Data Science at VIT and worked as a software engineer.
        </p>
        <p>
          Most of my favorite projects begin with a simple thought:{" "}
          &quot;I wonder if...&quot; Unfortunately, that thought is usually
          followed by three weeks of research, six notebooks, and a new GitHub
          repository.
        </p>
        <p>This website is where those adventures end up.</p>
      </div>

      {/* Education */}
      <h2 className="mt-12 font-body text-2xl font-bold text-ink">
        where curiosity took me 🎓
      </h2>
      <div className="mt-5 space-y-4">
        {education.map((e, i) => (
          <EntryCard key={e.title} entry={e} i={i} />
        ))}
      </div>

      {/* Skills */}
      <h2 className="mt-12 font-body text-2xl font-bold text-ink">
        things I tinker with 🛠️
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        little clusters of tools, all tangled together ✦
      </p>
      <SkillGraph />

      {/* Jobs */}
      <h2 className="mt-12 font-body text-2xl font-bold text-ink">
        where I clocked in 💼
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        tap a card to unfold the details ✦
      </p>
      <div className="mt-5 space-y-4">
        {timeline
          .filter((t) => !t.title.startsWith("Research Assistant"))
          .map((t, i) => (
            <EntryCard key={t.title} entry={t} i={i} />
          ))}
      </div>

      {/* Research */}
      <h2 className="mt-12 font-body text-2xl font-bold text-ink">
        the questions that kept me curious 🔬
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        tap a card to unfold the details ✦
      </p>
      <div className="mt-5 space-y-4">
        {timeline
          .filter((t) => t.title.startsWith("Research Assistant"))
          .map((t, i) => (
            <EntryCard key={t.title} entry={t} i={i} />
          ))}
      </div>

      <div className="mt-10 text-center">
        <a
          href="/Rishika_Resume.pdf"
          className="inline-flex items-center gap-2 rounded-full bg-blush/80 px-7 py-3 font-serif text-lg font-semibold italic text-ink transition hover:scale-105"
        >
          📄 peek at my résumé
        </a>
      </div>
    </PageShell>
  );
}
