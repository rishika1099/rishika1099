"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import PdfThumb from "@/components/PdfThumb";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import SkillGraph from "@/components/SkillGraph";
import type { Attachment, Entry } from "@/data/about";
import { domainColor } from "@/data/projects";
import { copyToHtml, detailsToHtml, hasDetails as entryHasDetails } from "@/lib/copyRender";
import { richToText } from "@/lib/richHtml";
import SectionNav from "@/components/SectionNav";

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
      {/* Compact chips rather than 96px tiles. A tile that size for a PDF
          nobody opens twice pushed the card tall, left a wide empty gutter
          beside it, and could only show a truncated name burned over the
          artwork ("19BDS0163_Ri…"). A chip carries a real preview and the whole
          filename, and several sit on one line. */}
      <div className={`mt-3 flex flex-wrap gap-2 ${textIndent(entry)}`}>
        {entry.attachments.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setOpen(a)}
            title={`open ${a.name}`}
            className="group flex max-w-full items-center gap-2 rounded-full bg-white/70 py-1 pl-1 pr-3 shadow-sm ring-1 ring-white/70 transition hover:bg-white hover:shadow"
          >
            <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-ink/5">
              {a.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/attachment/${a.id}`} alt="" className="h-full w-full object-cover" />
              ) : (
                <PdfThumb id={a.id} className="h-full w-full object-cover object-top" />
              )}
            </span>
            <span className="truncate font-body text-xs font-semibold text-ink-soft group-hover:text-ink">
              {a.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim()}
            </span>
            <span aria-hidden className="font-body text-[10px] text-ink-soft/70">
              {a.kind === "pdf" ? "PDF" : "IMG"}
            </span>
          </button>
        ))}
      </div>
      {open && <Lightbox attachment={open} onClose={() => setOpen(null)} />}
    </>
  );
}

/**
 * The company or school mark, sitting beside the emoji rather than replacing
 * it. It stretches to the height of the card's own content, from the date line
 * down through the tag chips, which is why it lives inside the button: the
 * expandable details sit outside, so an opened card does not stretch the logo
 * down with it. object-contain because a wordmark cropped to fit stops being a
 * logo, and the fixed width keeps every card's text starting at the same place.
 */
function EntryLogo({ logo }: { logo: NonNullable<Entry["logo"]> }) {
  return (
    // The box stretches, not the image. Letting a replaced element stretch
    // itself makes the browser resolve its height from its own aspect ratio,
    // which drags the whole card taller; a plain box has no such opinion.
    // Stretches to the card's content, but capped. Real entries run 350-550px
    // tall once the blurb and chips are in, and a logo floating in a strip that
    // long reads as an empty column rather than as a mark.
    <span className="max-h-28 w-14 shrink-0 self-stretch overflow-hidden rounded-2xl bg-white/80 p-2 ring-1 ring-white/70 sm:w-20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/attachment/${logo.id}`}
        alt={logo.name}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-contain"
      />
    </span>
  );
}

/**
 * How far the strip under a card has to be pushed to line up with the text.
 * It used to be a flat 3.25rem, which assumed the only thing to its left was an
 * emoji. Adding a logo widened that column and left the files and the details
 * hanging under the marks instead of under the words. Zero on a phone, where
 * the marks sit on their own row above the text.
 */
function textIndent(entry: Entry): string {
  // emoji 3rem + gap 1rem, plus logo 5rem + gap 1rem when there is one
  return entry.logo ? "sm:ml-40" : "sm:ml-16";
}

function EntryCard({ entry, i }: { entry: Entry; i: number }) {
  const [open, setOpen] = useState(false);
  const hasDetails = entryHasDetails(entry.details);
  return (
    <m.div
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
        className={`flex w-full flex-col gap-3 text-left sm:flex-row sm:gap-4 ${
          hasDetails ? "cursor-pointer" : "cursor-default"
        }`}
      >
        {/* On a phone the emoji and the logo sit in a row above the text, which
            then gets the full width. Side by side they left the blurb 113px, or
            about thirteen characters a line, on a 375px screen. `sm:contents`
            dissolves this wrapper on wider screens so both go back to being
            direct children of the row, which is the desktop layout unchanged. */}
        <span className="flex shrink-0 items-center gap-3 sm:contents">
          <span className="animate-float-med flex h-12 w-12 shrink-0 items-center justify-center text-3xl">
            {entry.icon}
          </span>
          {entry.logo && <EntryLogo logo={entry.logo} />}
        </span>
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
              <m.span
                className="absolute inset-0 rounded-full bg-lavender"
                initial={{ opacity: 0.5, scale: 0.85 }}
                animate={{ opacity: [0.5, 0, 0.5], scale: [0.85, 1.6, 0.85] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <m.span
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex h-7 w-7 select-none items-center justify-center rounded-full bg-lavender/60 font-body text-base leading-none text-ink"
            >
              ⌄
            </m.span>
          </span>
        )}
      </button>

      <Attachments entry={entry} />

      <AnimatePresence initial={false}>
        {open && hasDetails && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`mt-2 overflow-hidden ${textIndent(entry)}`}
          >
            <div
              className="rich-passage entry-details font-body text-sm text-ink-soft [&_li]:mt-2 [&_ul]:list-none"
              dangerouslySetInnerHTML={{ __html: detailsToHtml(entry.details) }}
            />
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}

export default function AboutClient({
  education,
  timeline,
  certifications = [],
  bioHtml,
  title,
  heads,
  navLabels,
}: {
  education: Entry[];
  timeline: Entry[];
  certifications?: Entry[];
  bioHtml: string;
  title: React.ReactNode;
  navLabels: {
    education: string;
    skills: string;
    work: string;
    research: string;
    certifications: string;
  };
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

      <SectionNav
        sections={[
          { id: "education", label: navLabels.education },
          { id: "skills", label: navLabels.skills },
          { id: "work", label: navLabels.work },
          { id: "research", label: navLabels.research },
          ...(certifications.length
            ? [{ id: "certifications", label: navLabels.certifications }]
            : []),
        ]}
      />

      {/* Education */}
      <h2 id="education" className="mt-12 scroll-mt-32 font-body text-2xl font-bold text-ink">
        {heads.education}
      </h2>
      <div className="mt-5 space-y-4">
        {education.map((e, i) => (
          <EntryCard key={e.title} entry={e} i={i} />
        ))}
      </div>

      {/* Skills */}
      <h2 id="skills" className="mt-12 scroll-mt-32 font-body text-2xl font-bold text-ink">
        {heads.skills}
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        {heads.skillsSub}
      </p>
      <SkillGraph />

      {/* Jobs */}
      <h2 id="work" className="mt-12 scroll-mt-32 font-body text-2xl font-bold text-ink">
        {heads.work}
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        tap a card to unfold the details ✦
      </p>
      <div className="mt-5 space-y-4">
        {timeline
          .filter((t) => !richToText(t.title).includes("Research Assistant"))
          .map((t, i) => (
            <EntryCard key={t.title} entry={t} i={i} />
          ))}
      </div>

      {/* Research */}
      <h2 id="research" className="mt-12 scroll-mt-32 font-body text-2xl font-bold text-ink">
        {heads.research}
      </h2>
      <p className="mt-1 font-body text-sm text-ink-soft">
        tap a card to unfold the details ✦
      </p>
      <div className="mt-5 space-y-4">
        {timeline
          .filter((t) => richToText(t.title).includes("Research Assistant"))
          .map((t, i) => (
            <EntryCard key={t.title} entry={t} i={i} />
          ))}
      </div>

      {/* Certifications & short courses (only when there are any) */}
      {certifications.length > 0 && (
        <>
          <h2 id="certifications" className="mt-12 scroll-mt-32 font-body text-2xl font-bold text-ink">{heads.certifications}</h2>
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
