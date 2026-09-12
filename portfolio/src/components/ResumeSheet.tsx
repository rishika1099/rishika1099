import type { ResumeSection } from "@/lib/resumeTex";

// The resume body, rendered from the same .tex the PDF is compiled from.
//
// Shared by the print page and the preview on the recruiter page, so the two
// cannot drift: someone reading the preview is reading the resume, not a second
// copy of it kept in another file.

const HEADING =
  "border-b border-ink/20 pb-1 font-body text-xs font-bold uppercase tracking-[0.18em] text-ink-soft";

function TexSection({ section }: { section: ResumeSection }) {
  return (
    <section className="mt-8 print:mt-6">
      <h2 className={HEADING} dangerouslySetInnerHTML={{ __html: section.title }} />
      {section.lines.length > 0 && (
        <div className="mt-3 space-y-1">
          {section.lines.map((l, i) => (
            <p
              key={i}
              className="font-body text-sm text-ink [&_strong]:font-bold"
              dangerouslySetInnerHTML={{ __html: l }}
            />
          ))}
        </div>
      )}
      {section.entries.length > 0 && (
        <div className="mt-4 space-y-5 print:space-y-4">
          {section.entries.map((e, i) => (
            <div key={i} className="entry">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <h3
                  className="font-body text-[15px] font-bold text-ink"
                  dangerouslySetInnerHTML={{ __html: e.left }}
                />
                <span
                  className="font-body text-xs italic text-ink-soft [&_a]:underline [&_a]:decoration-blush/60"
                  dangerouslySetInnerHTML={{ __html: e.right }}
                />
              </div>
              {(e.subLeft || e.subRight) && (
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p
                    className="font-body text-sm italic text-ink-soft"
                    dangerouslySetInnerHTML={{ __html: e.subLeft ?? "" }}
                  />
                  <span
                    className="font-body text-xs italic text-ink-soft"
                    dangerouslySetInnerHTML={{ __html: e.subRight ?? "" }}
                  />
                </div>
              )}
              {e.bullets.length > 0 && (
                <ul className="mt-1.5 list-disc space-y-1 pl-5 font-body text-sm text-ink">
                  {e.bullets.map((b, j) => (
                    <li key={j} dangerouslySetInnerHTML={{ __html: b }} />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ResumeSheet({ sections }: { sections: ResumeSection[] }) {
  return (
    <>
      {sections.map((s, i) => (
        <TexSection key={i} section={s} />
      ))}
    </>
  );
}
