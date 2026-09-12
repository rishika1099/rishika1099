import Link from "next/link";
import { getAboutEntries } from "@/lib/aboutData";
import { getContactLinks } from "@/lib/contactLinks";
import { getCopy } from "@/lib/siteCopy";
import { getResumeTex } from "@/lib/resumeSource";
import { parseResumeTex } from "@/lib/resumeTex";
import ResumeSheet from "@/components/ResumeSheet";
import { copyToHtml, detailsToHtml, hasDetails } from "@/lib/copyRender";
import PrintButtons from "@/components/PrintButtons";
import type { Entry } from "@/data/about";

// reads the live resume source + contact data, so the page always matches the PDF
export const dynamic = "force-dynamic";
export const metadata = { title: "Resume" };

const HEADING =
  "border-b border-ink/20 pb-1 font-body text-xs font-bold uppercase tracking-[0.18em] text-ink-soft";

/** Fallback: the About timeline, used only if the resume source won't parse. */
function AboutSection({ title, entries }: { title: string; entries: Entry[] }) {
  if (!entries.length) return null;
  return (
    <section className="mt-8 print:mt-6">
      <h2 className={HEADING}>{title}</h2>
      <div className="mt-4 space-y-5 print:space-y-4">
        {entries.map((e, i) => (
          <div key={i} className="entry">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <h3
                className="font-body text-[15px] font-bold text-ink"
                dangerouslySetInnerHTML={{ __html: copyToHtml(e.title) }}
              />
              <span
                className="font-body text-xs italic text-ink-soft"
                dangerouslySetInnerHTML={{ __html: copyToHtml(e.when) }}
              />
            </div>
            <p
              className="font-body text-sm text-ink-soft"
              dangerouslySetInnerHTML={{ __html: copyToHtml(e.place) }}
            />
            {e.note && (
              <p
                className="mt-1 font-body text-sm text-ink"
                dangerouslySetInnerHTML={{ __html: copyToHtml(e.note) }}
              />
            )}
            {hasDetails(e.details) && (
              <div
                className="rich-passage mt-1.5 font-body text-sm text-ink [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: detailsToHtml(e.details) }}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function ResumePrintPage() {
  const [tex, { timeline, education }, contact, copy] = await Promise.all([
    getResumeTex(),
    getAboutEntries(),
    getContactLinks(),
    getCopy(),
  ]);

  // the resume source is the source of truth; the About timeline is only a
  // safety net for a template this parser doesn't recognise
  const sections = parseResumeTex(tex);

  const name =
    [copy["home.name1"], copy["home.name2"]].filter(Boolean).join(" ") ||
    "Rishika Mamidibathula";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 print:px-0 print:py-0">
      <PrintButtons />

      <div className="resume-sheet">
        {/* header: the site's own contact links, not the ones printed on the PDF */}
        <header className="border-b border-ink/20 pb-4">
          <h1 className="font-display text-3xl font-bold text-ink">{name}</h1>
          <p className="mt-1 font-body text-sm text-ink-soft">
            {copy["resume.subtitle"] || "Data Scientist & ML Engineer · New York City"}
          </p>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-body text-xs text-ink-soft">
            {contact.map((c) => (
              <a key={c.href} href={c.href} className="hover:text-ink">
                {c.value}
              </a>
            ))}
          </p>
        </header>

        {sections.length > 0 ? (
          <ResumeSheet sections={sections} />
        ) : (
          <>
            <AboutSection title="Experience" entries={timeline} />
            <AboutSection title="Education" entries={education} />
          </>
        )}
      </div>

      <p className="no-print mt-10 text-center font-body text-sm text-ink-soft">
        <Link href="/about" className="hover:text-ink">← back to about</Link>
      </p>
    </div>
  );
}
