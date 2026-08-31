"use client";

/**
 * The About entry card, and everything it opens into.
 *
 * Lives here rather than inside the About page because the recruiter view shows
 * the same entries and should show the same card: the same mark, the same
 * chips, the same click into a dialog with the details and the files. Two
 * renderings of one job that behave differently is how they drift apart.
 */

import { m } from "framer-motion";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PdfThumb from "@/components/PdfThumb";
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
      {/* Tiles, not name-carrying pills: a pill wide enough for "19BDS0163
          Rishikas VIT Transcript" cannot share a row, so three files became
          three stacked bars. A tile shows the document and several fit across.
          No left indent either, which puts them in the empty column under the
          mark rather than leaving it blank. */}
      <div className="mt-3 flex flex-wrap gap-2.5">
        {entry.attachments.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setOpen(a)}
            title={a.name}
            aria-label={`open ${a.name}`}
            className="relative block h-[4.5rem] w-[4.5rem] overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-white/70 transition hover:scale-105 hover:shadow"
          >
            {a.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/attachment/${a.id}`}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => (e.currentTarget.style.visibility = "hidden")}
              />
            ) : (
              <PdfThumb id={a.id} className="h-full w-full object-contain object-top" />
            )}
            <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-ink/60 px-1.5 py-0.5 text-left font-body text-[9px] font-semibold text-cream">
              {a.name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim()}
            </span>
          </button>
        ))}
      </div>
      {open && <Lightbox attachment={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function EntryMark({ entry, hidden }: { entry: Entry; hidden?: boolean }) {
  const [broken, setBroken] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // onError alone is not enough: the image is server-rendered, so it can finish
  // failing before React hydrates and attaches the handler, and nothing fires.
  // A complete image with no intrinsic width is one that failed.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setBroken(true);
  }, []);

  if (hidden) return null;
  if (!entry.logo || broken) {
    return (
      <span className="animate-float-med flex min-h-14 w-14 shrink-0 items-center justify-center self-stretch text-3xl">
        {entry.icon}
      </span>
    );
  }
  return (
    // Stretched to the height of the heading beside it, so the tile runs down to
    // where the description starts instead of leaving a hole under a 56px
    // square. The picture stays contained and centred inside it: it is the
    // tile that fills the space, not a stretched logo.
    <span className="relative flex min-h-14 w-14 shrink-0 items-center justify-center self-stretch">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={`/api/attachment/${entry.logo.id}`}
        alt={entry.logo.name}
        decoding="async"
        onError={() => setBroken(true)}
        // contain, not cover: a wordmark cropped square stops being a logo
        className="h-full w-full rounded-2xl bg-white/85 object-contain p-1.5 ring-1 ring-white/70"
      />
      <span
        aria-hidden
        className="absolute -bottom-1.5 -left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-cream text-sm shadow-sm ring-1 ring-white/80"
      >
        {entry.icon}
      </span>
    </span>
  );
}

/**
 * Details open in a dialog rather than unfolding inside the card.
 *
 * In two columns an expanding card stretched its grid row, so opening the VIT
 * entry left a column of empty white beside it as tall as its coursework list.
 * A dialog leaves the grid alone and gives the bullets room to be read.
 */
function EntryDialog({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // the page must not scroll behind it
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={richToText(entry.title)}
    >
      <m.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        // the ground of whatever page opened it, published by PageShell
        style={{ backgroundColor: "var(--page-surface, #fff8f0)" }}
        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start gap-4">
          <EntryMark entry={entry} />
          <div className="flex-1">
            <div
              className="rich-passage font-body text-sm italic text-ink-soft"
              dangerouslySetInnerHTML={{ __html: copyToHtml(entry.when) }}
            />
            <h3
              className="rich-passage font-body text-xl font-bold text-ink"
              dangerouslySetInnerHTML={{ __html: copyToHtml(entry.title) }}
            />
            {entry.subtitle && (
              <div
                className="rich-passage font-body text-base font-semibold text-ink/80"
                dangerouslySetInnerHTML={{ __html: copyToHtml(entry.subtitle) }}
              />
            )}
            <div
              className="rich-passage font-body text-sm font-semibold text-ink-soft"
              dangerouslySetInnerHTML={{ __html: copyToHtml(entry.place) }}
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="close"
            className="shrink-0 rounded-full bg-white/70 px-3 py-1 font-body text-sm font-semibold text-ink-soft transition hover:bg-white hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div
          className="rich-passage mt-3 font-body text-sm text-ink-soft"
          dangerouslySetInnerHTML={{ __html: copyToHtml(entry.note) }}
        />
        <div
          className="rich-passage entry-details mt-4 font-body text-sm text-ink-soft [&_li]:mt-2 [&_ul]:list-none"
          dangerouslySetInnerHTML={{ __html: detailsToHtml(entry.details) }}
        />
        <Attachments entry={entry} />
      </m.div>
    </div>,
    document.body,
  );
}

export default function EntryCard({
  entry,
  i,
  className = "",
  noMark = false,
  showFiles = false,
  showAttachments = false,
}: {
  entry: Entry;
  i: number;
  /**
   * Say how many files open with the card. Only the work entries do: they are
   * full-width bars with room for a line of their own, where the narrow
   * education, research and certification cards would just be given a fifth
   * thing to stack.
   */
  showFiles?: boolean;
  /**
   * Put the files on the card itself. Certifications do: the certificate is
   * the point of the entry, so showing it is worth the height. Work keeps its
   * behind the click and says so with showFiles instead.
   */
  showAttachments?: boolean;
  /** set when the card sits on a shelf rather than in a stack */
  className?: string;
  /** certifications show no mark: no logo, and an emoji adds nothing there */
  noMark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const files = entry.attachments ?? [];
  // Attachments live behind the click now. A row of 72px tiles set the height
  // of every card beside it, and on a card whose text was already short that
  // read as one big hole. What is left is a count, so the card still says the
  // certificate is there.
  const hasDetails = entryHasDetails(entry.details) || files.length > 0;
  const fills = useContext(FilledNotes);
  const filledNote = fills[richToText(entry.title)] ?? entry.note;
  return (
    <m.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: i * 0.06 }}
      data-carousel-item
      className={`group relative rounded-3xl p-5 soft-card transition duration-200 ${className} ${
        hasDetails ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg" : ""
      } ${showAttachments ? "flex flex-col" : ""}`}
    >
      {/* The whole card opens it, not just the corner icon. The button sits
          under the content and the content lets clicks through, so a file tile
          still opens its file rather than the card. */}
      {hasDetails && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={`read more about ${richToText(entry.title)}`}
          title="read the details"
          className="absolute inset-0 z-0 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blush"
        />
      )}
      {/* Pinned to the card's corner rather than sitting in the row. As a row
          child it followed the text into the column on a phone and came out
          floating under the chips, which is what looked misplaced. */}
      {hasDetails && (
        <span
          className="pointer-events-none absolute right-4 top-4 z-10 flex items-center gap-2"
          aria-hidden
        >
          <span className="relative flex h-7 w-7 items-center justify-center">
            {/* soft sonar pulse in the page's lilac tone */}
            <m.span
              className="absolute inset-0 rounded-full bg-lavender"
              initial={{ opacity: 0.5, scale: 0.85 }}
              animate={{ opacity: [0.5, 0, 0.5], scale: [0.85, 1.6, 0.85] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="relative flex h-7 w-7 select-none items-center justify-center rounded-full bg-lavender/60 font-body text-xs leading-none text-ink shadow-sm transition duration-200 group-hover:scale-125 group-hover:bg-lavender group-hover:shadow-md">
              ⤢
            </span>
          </span>
        </span>
      )}
      <div
        className={`relative z-10 w-full text-left ${hasDetails ? "pointer-events-none" : ""}`}
      >
        {/* The heading stays beside the mark, the prose runs under it.
            Letting the title itself wrap around a float dropped its last word
            to the far left below the emoji, dangling under an indented line
            above it. Only what reads as a paragraph should flow that way. */}
        <div className="flex gap-4">
          {!noMark && <EntryMark entry={entry} hidden={noMark} />}
          {/* room kept clear on the right for the corner icon */}
          <div className={`min-w-0 flex-1 ${hasDetails ? "pr-9" : ""}`}>
            <div
              className="rich-passage font-body text-sm italic text-ink-soft"
              dangerouslySetInnerHTML={{ __html: copyToHtml(entry.when) }}
            />
            <h3
              className="rich-passage font-body text-lg font-bold text-ink"
              dangerouslySetInnerHTML={{ __html: copyToHtml(entry.title) }}
            />
            {entry.subtitle && (
              <div
                className="rich-passage font-body text-base font-semibold text-ink/80"
                dangerouslySetInnerHTML={{ __html: copyToHtml(entry.subtitle) }}
              />
            )}
            <div
              className="rich-passage font-body text-sm font-semibold text-ink-soft"
              dangerouslySetInnerHTML={{ __html: copyToHtml(entry.place) }}
            />
          </div>
        </div>
        <div className={hasDetails ? "pr-9" : ""}>
          <div
            className="rich-passage mt-2 font-body text-sm text-ink-soft"
            dangerouslySetInnerHTML={{ __html: copyToHtml(filledNote) }}
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
          {showFiles && files.length > 0 && (
            <p className="mt-2.5 font-body text-[11px] font-semibold text-ink-soft/70">
              📎 {files.length} {files.length === 1 ? "file" : "files"} inside
            </p>
          )}
        </div>
      </div>

      {showAttachments && (
        // Above the overlay, so a tile opens the file it shows, and at the foot
        // of the card. Every card in a shelf is as tall as the wordiest one, so
        // a shorter one has slack to put somewhere: above the certificate it
        // reads as spacing, below it reads as the card having run out. The
        // project cards pin their buttons the same way.
        <div className="relative z-10 mt-auto">
          <Attachments entry={entry} />
        </div>
      )}

      {open && hasDetails && (
        <EntryDialog entry={entry} onClose={() => setOpen(false)} />
      )}
    </m.div>
  );
}

// The card notes, rewritten to the height the cards already are. Empty until
// the fetch lands, and every card falls back to its own note, so the page is
// correct before it arrives and merely fuller after.
export const FilledNotes = createContext<Record<string, string>>({});
