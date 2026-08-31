"use client";

import EntryCard from "@/components/EntryCard";
import type { Entry } from "@/data/about";

/**
 * The About cards, on the recruiter page. A thin client boundary so a server
 * page can render the same card the About page does, with the same mark, the
 * same chips and the same click into the details and the files.
 */
export default function RecruiterEntries({
  entries,
  columns = 2,
  showFiles = false,
  showAttachments = true,
}: {
  entries: Entry[];
  /** one across for the timeline, two for education and research */
  columns?: 1 | 2;
  /** say how many files open with the card, the way the work bars do */
  showFiles?: boolean;
  /** put the files on the card. Off for work, where a training PDF is not the job */
  showAttachments?: boolean;
}) {
  return (
    <div className={columns === 2 ? "mt-5 grid gap-4 sm:grid-cols-2" : "mt-5 space-y-4"}>
      {entries.map((e, i) => (
        <EntryCard
          key={`${e.title}-${i}`}
          entry={e}
          i={i}
          showFiles={showFiles}
          showAttachments={showAttachments}
        />
      ))}
    </div>
  );
}
