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
    icon: "🧸",
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
    note: "An LLM pipeline that turns years of messy clinical notes into structured, research-ready data, with patient privacy and accuracy built in.",
    details: [
      "Built an end-to-end system that reads years of cardiology and rheumatology notes for a cohort of cardiac-sarcoidosis patients and extracts dozens of structured clinical variables.",
      "Reconstructed fragmented hospital records into clean, chronological patient timelines so the model could reason over how the disease and treatments evolved.",
      "Designed a HIPAA-safe de-identification step that strips out patient identifiers before anything reaches the model, with no protected data ever written to disk.",
      "Engineered safeguards so the model only captures facts that are explicitly stated, never guessing or filling in missing details.",
      "Validated the extracted data against blinded chart review by two clinicians to measure real-world accuracy.",
    ],
  },
  {
    icon: "⚖️",
    when: "Jan 2026 – Present",
    title: "Research Assistant: Human Rights LLM Evaluation",
    place: "Columbia GSAS",
    note: "An LLM framework that scores defense manufacturers on human-rights due diligence and checks its own judgments against expert raters.",
    details: [
      "Automated human-rights due-diligence scoring for 27 defense manufacturers, grounded in UN, UNICEF, and Arms Trade Treaty frameworks.",
      "Scored each company across nine dimensions, including a dedicated set of children's-rights criteria.",
      "Two-stage design so the model can't make things up: one stage gathers and quotes real evidence from company policy documents, a second stage scores it with transparent reasoning.",
      "Benchmarked the model's scores against expert human raters and reported how closely they agreed.",
      "Produced an auditable report where every score traces back to its source.",
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
  {
    icon: "📢",
    when: "Feb – Mar 2022",
    title: "Data Visualization Intern",
    place: "Saint Louis University",
    note: "Built Tableau dashboards to analyze campaign performance and guide resource allocation.",
    details: [
      "Tableau dashboards on campaign performance metrics.",
      "Insights that sharpened analysis and resource allocation.",
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
      "**Coursework:** Applied Deep Learning, LLM-based Generative AI Systems, Causal Inference, High Performance Machine Learning, Machine Learning, Statistical Inference and Modelling, Exploratory Data Analysis and Visualization, and Agentic AI.",
      "Teaching Assistant for Artificial Intelligence for Public Policy at the Data Science Institute.",
      "DSI Student Council, Communications & Professional Resources.",
      "Research assistant on two LLM projects: clinical phenotyping and human-rights evaluation.",
    ],
  },
  {
    icon: "🎓",
    when: "2019 – 2023",
    title: "B.Tech, Computer Science & Data Science",
    place: "Vellore Institute of Technology (VIT)",
    note: "4.0/4.0 GPA · graduated ranked 7th of ~200 (top 4%).",
    details: [
      "Perfect 4.0/4.0 GPA, ranked 7th of ~200 (top 4%).",
      "Merit Scholarship recipient, 2019 to 2023, and Program Representative for all four years.",
      "**Data Science** coursework: Artificial Intelligence, Machine Learning, Deep Learning, Natural Language Processing, Image Processing, Predictive Analytics, Business Intelligence and Analytics, and Social and Information Networks.",
      "**Computer Science** coursework: Data Structures and Algorithms, Object-Oriented Programming, Database Management Systems, Operating Systems, Computer Architecture, Theory of Computation and Compiler Design, Network and Communication, Internet Programming and Web Technologies, Internet of Things, and Cryptography and Network Security.",
      "**Mathematics** coursework: Calculus, Applied Linear Algebra, Discrete Mathematics and Graph Theory, Statistics, and Differential Equations.",
    ],
  },
];


// render a detail string, bolding any **wrapped** segment
function renderDetail(d: string) {
  return d.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-bold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

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
                <span>{renderDetail(d)}</span>
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
      <PageTitle>the human behind the models 🦦</PageTitle>

      <div className="mt-6 max-w-4xl space-y-4 font-body text-lg text-ink-soft">
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
        where curiosity paid the bills 💼
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
        where curiosity became research 🔬
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
          className="inline-flex items-center gap-2 rounded-full bg-blush/80 px-7 py-3 font-body text-lg font-semibold text-ink transition hover:scale-105"
        >
          👀 peek at my résumé
        </a>
      </div>
    </PageShell>
  );
}
