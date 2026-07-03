"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import SkillGraph from "@/components/SkillGraph";
import type { Entry } from "@/data/about";
import { domainColor } from "@/data/projects";


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
          {Boolean(entry.domains?.length || entry.tech?.length) && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {entry.domains?.map((d) => (
                <span
                  key={d}
                  style={{ backgroundColor: domainColor[d] }}
                  className="rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink"
                >
                  {d}
                </span>
              ))}
              {entry.tech?.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-mint/70 px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink-soft"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
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

export default function AboutClient({
  education,
  timeline,
}: {
  education: Entry[];
  timeline: Entry[];
}) {
  return (
    <PageShell vibe="lilac">
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

      <div className="mt-6 text-center">
        <a
          href="/Rishika_Resume.pdf"
          className="inline-flex items-center gap-2 rounded-full bg-blush/80 px-7 py-3 font-body text-lg font-semibold text-ink shadow-lg shadow-ink/20 transition hover:scale-105"
        >
          👀 peek at my resume
        </a>
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
    </PageShell>
  );
}
