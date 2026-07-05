// The site footer. The name/sign-off is editable in the atelier; the year sets
// itself. Server component so it can read the copy overrides at request time.

import { getCopy } from "@/lib/siteCopy";
import { copyToHtml } from "@/lib/copyRender";

export default async function SiteFooter() {
  const copy = await getCopy();
  return (
    <footer className="relative px-5 py-8 text-center font-body text-xs text-ink-soft/70">
      <span className="mr-1">©</span>
      {new Date().getFullYear()}{" "}
      <span
        className="rich-passage"
        dangerouslySetInnerHTML={{ __html: copyToHtml(copy["footer.name"]) }}
      />
    </footer>
  );
}
