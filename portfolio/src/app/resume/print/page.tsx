import Link from "next/link";
import { getAboutEntries } from "@/lib/aboutData";
import { getContactLinks } from "@/lib/contactLinks";
import { getCopy } from "@/lib/siteCopy";
import { copyToHtml, detailsToHtml, hasDetails } from "@/lib/copyRender";
import PrintButtons from "@/components/PrintButtons";
import type { Entry } from "@/data/about";

// pulls the live About + contact data, so the printed resume always matches
export const dynamic = "force-dynamic";
export const metadata = { title: "Resume" };

function Section({ title, entries }: { title: string; entries: Entry[] }) {
  if (!entries.length) return null;
  return (
    <section className="mt-8 print:mt-6">
      <h2 className="border-b border-ink/20 pb-1 font-body text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">
        {title}
      </h2>
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
  const [{ timeline, education }, contact, copy] = await Promise.all([
    getAboutEntries(),
    getContactLinks(),
    getCopy(),
  ]);

  const name = [copy["home.name1"], copy["home.name2"]].filter(Boolean).join(" ") || "Rishika Mamidibathula";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 print:px-0 print:py-0">
      <PrintButtons />

      <div className="resume-sheet">
        {/* header */}
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

        <Section title="Experience" entries={timeline} />
        <Section title="Education" entries={education} />
      </div>

      <p className="no-print mt-10 text-center font-body text-sm text-ink-soft">
        <Link href="/about" className="hover:text-ink">← back to about</Link>
      </p>
    </div>
  );
}
