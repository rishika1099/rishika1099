"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import SkillGraph from "@/components/SkillGraph";
import type { Attachment, Entry } from "@/data/about";
import { domainColor } from "@/data/projects";
import { copyToHtml, detailsToHtml, hasDetails as entryHasDetails } from "@/lib/copyRender";
import { richToText } from "@/lib/richHtml";

// full-screen viewer for an attachment (Esc or backdrop to close)
function Lightbox({ attachment, onClose }: { attachment: Attachment; onClose: () => void }) {
  const url = `/api/attachment/${attachment.id}`;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (typeof document === "undefined") return null;
  // portal to <body> so a transformed ancestor (the framer-motion card) can't
  // clip the fixed overlay
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="truncate font-body text-sm font-semibold text-cream">
            {attachment.kind === "image" ? "🖼️" : "📄"} {attachment.name}
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/20 px-3 py-1 font-body text-xs font-semibold text-cream transition hover:bg-white/30"
            >
              open ↗
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="close"
              className="rounded-full bg-white/20 px-3 py-1 font-body text-xs font-semibold text-cream transition hover:bg-white/30"
            >
              ✕ close
            </button>
          </span>
        </div>
        {attachment.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={attachment.name} className="mx-auto max-h-[85vh] w-auto rounded-2xl shadow-2xl" />
        ) : (
          <iframe title={attachment.name} src={url} className="h-[85vh] w-full rounded-2xl bg-white shadow-2xl" />
        )}
      </div>
    </div>,
    document.body,
  );
}

function Attachments({ entry }: { entry: Entry }) {
  const [open, setOpen] = useState<Attachment | null>(null);
  if (!entry.attachments?.length) return null;
  return (
    <>
      <div className="ml-[3.25rem] mt-3 flex flex-wrap gap-3">
        {entry.attachments.map((a) => {
          const url = `/api/attachment/${a.id}`;
          if (a.kind === "image") {
            return (
              <button key={a.id} type="button" onClick={() => setOpen(a)} title={a.name} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={a.name}
                  className="h-24 w-24 rounded-xl object-cover shadow-sm ring-1 ring-white/70 transition hover:scale-105"
                />
              </button>
            );
          }
          // PDF: same-size thumbnail as the images (a clipped page preview);
          // click opens the full lightbox (which has its own open ↗)
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setOpen(a)}
              title={a.name}
              className="relative block h-24 w-24 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-white/70 transition hover:scale-105"
            >
              <iframe
                title={a.name}
                tabIndex={-1}
                src={`${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className="pointer-events-none border-0"
                style={{ width: 320, height: 320, transform: "scale(0.3)", transformOrigin: "top left" }}
              />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-ink/60 px-1.5 py-0.5 text-left font-body text-[9px] font-semibold text-cream">
                📄 {a.name}
              </span>
            </button>
          );
        })}
      </div>
      {open && <Lightbox attachment={open} onClose={() => setOpen(null)} />}
    </>
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
          <span className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center" aria-hidden>
            {/* soft sonar pulse in the page's lilac tone, hints "tap to expand"
                (only while collapsed) */}
            {!open && (
              <motion.span
                className="absolute inset-0 rounded-full bg-lavender"
                initial={{ opacity: 0.5, scale: 0.85 }}
                animate={{ opacity: [0.5, 0, 0.5], scale: [0.85, 1.6, 0.85] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <motion.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex h-7 w-7 select-none items-center justify-center rounded-full bg-lavender/60 font-body text-base leading-none text-ink"
            >
              ⌄
            </motion.span>
          </span>
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
    </PageShell>
  );
}
