"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import SkillGraph from "@/components/SkillGraph";
import type { Entry } from "@/data/about";
import { domainColor } from "@/data/projects";
import { copyToHtml, detailsToHtml, hasDetails as entryHasDetails } from "@/lib/copyRender";
import { richToText } from "@/lib/richHtml";

function Attachments({ entry }: { entry: Entry }) {
  if (!entry.attachments?.length) return null;
  return (
    <div className="ml-[3.25rem] mt-3 flex flex-wrap gap-2">
      {entry.attachments.map((a) => {
        const url = `/api/attachment/${a.id}`;
        return a.kind === "image" ? (
          <a key={a.id} href={url} target="_blank" rel="noreferrer" title={a.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={a.name}
              className="h-20 w-20 rounded-xl object-cover shadow-sm ring-1 ring-white/70 transition hover:scale-105"
            />
          </a>
        ) : (
          <a
            key={a.id}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 font-body text-xs font-semibold text-ink-soft shadow-sm ring-1 ring-white/70 transition hover:text-ink"
          >
            📄 {a.name}
          </a>
        );
      })}
    </div>
  );
}

function EntryCard({ entry, i }: { entry: Entry; i: number }) {
  const [open, setOpen] = useState(false);
  const hasDetails = entryHasDetails(entry.details);
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
          <div
            className="rich-passage font-body text-sm italic text-ink-soft"
            dangerouslySetInnerHTML={{ __html: copyToHtml(entry.when) }}
          />
          <h3
            className="rich-passage font-body text-lg font-bold text-ink"
            dangerouslySetInnerHTML={{ __html: copyToHtml(entry.title) }}
          />
          <div
            className="rich-passage font-body text-sm font-semibold text-ink-soft"
            dangerouslySetInnerHTML={{ __html: copyToHtml(entry.place) }}
          />
          <div
            className="rich-passage mt-1 font-body text-sm text-ink-soft"
            dangerouslySetInnerHTML={{ __html: copyToHtml(entry.note) }}
          />
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

      <Attachments entry={entry} />

      <AnimatePresence initial={false}>
        {open && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="ml-[3.25rem] mt-2 overflow-hidden"
          >
            <div
              className="rich-passage entry-details font-body text-sm text-ink-soft [&_li]:mt-2 [&_ul]:list-none"
              dangerouslySetInnerHTML={{ __html: detailsToHtml(entry.details) }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AboutClient({
  education,
  timeline,
  certifications = [],
  bioHtml,
  title,
  heads,
}: {
  education: Entry[];
  timeline: Entry[];
  certifications?: Entry[];
  bioHtml: string;
  title: React.ReactNode;
  heads: {
    education: React.ReactNode;
    skills: React.ReactNode;
    skillsSub: React.ReactNode;
    work: React.ReactNode;
    research: React.ReactNode;
    certifications: React.ReactNode;
  };
}) {
  return (
    <PageShell vibe="lilac">
      <PageTitle>{title}</PageTitle>

      <div
        className="rich-passage mt-6 max-w-4xl font-body text-lg text-ink-soft"
        // written in the atelier's ink editor; sanitized at save
        dangerouslySetInnerHTML={{ __html: bioHtml }}
      />

      <div className="mt-6 flex flex-col items-center gap-2">
        <a
          href="/resume"
          className="inline-flex items-center gap-2 rounded-full bg-blush/80 px-7 py-3 font-body text-lg font-semibold text-ink shadow-lg shadow-ink/20 transition hover:scale-105"
        >
          👀 peek at my resume
        </a>
        <a
          href="/resume/print"
          className="font-body text-sm text-ink-soft underline decoration-blush/60 underline-offset-4 hover:text-ink"
        >
          or read it as a page
        </a>
      </div>

      {/* Education */}
      <h2 className="mt-12 font-body text-2xl font-bold text-ink">
        {heads.education}
      </h2>
      <div className="mt-5 space-y-4">
        {education.map((e, i) => (
          <EntryCard key={e.title} entry={e} i={i} />
        ))}
      </div>

      {/* Certifications & short courses (only when there are any) */}
      {certifications.length > 0 && (
        <>
          <h2 className="mt-12 font-body text-2xl font-bold text-ink">{heads.certifications}</h2>
          <div className="mt-5 space-y-4">
            {certifications.map((e, i) => (
              <EntryCard key={e.title} entry={e} i={i} />
            ))}
          </div>
        </>
      )}

      {/* Skills */}
      <h2 className="mt-12 font-body text-2xl font-bold text-ink">
        {heads.skills}
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        {heads.skillsSub}
      </p>
      <SkillGraph />

      {/* Jobs */}
      <h2 className="mt-12 font-body text-2xl font-bold text-ink">
        {heads.work}
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        tap a card to unfold the details ✦
      </p>
      <div className="mt-5 space-y-4">
        {timeline
          .filter((t) => !richToText(t.title).startsWith("Research Assistant"))
          .map((t, i) => (
            <EntryCard key={t.title} entry={t} i={i} />
          ))}
      </div>

      {/* Research */}
      <h2 className="mt-12 font-body text-2xl font-bold text-ink">
        {heads.research}
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        tap a card to unfold the details ✦
      </p>
      <div className="mt-5 space-y-4">
        {timeline
          .filter((t) => richToText(t.title).startsWith("Research Assistant"))
          .map((t, i) => (
            <EntryCard key={t.title} entry={t} i={i} />
          ))}
      </div>
    </PageShell>
  );
}
