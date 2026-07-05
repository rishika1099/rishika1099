import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import PoemsClient from "@/components/PoemsClient";
import RichText from "@/components/RichText";
import { getCopy } from "@/lib/siteCopy";
import { copyToHtml } from "@/lib/copyRender";

export const metadata = { title: "Poems" };
// title is editable in the atelier
export const dynamic = "force-dynamic";

export default async function PoemsPage() {
  const copy = await getCopy();
  return (
    <PageShell vibe="twilight">
      <PageTitle className="text-cream"><RichText html={copyToHtml(copy["poems.title"])} /></PageTitle>
      <div className="mt-3">
        <Link
          href="/blog"
          className="font-body text-sm text-lavender/90 hover:text-white"
        >
          ← back to the writing room
        </Link>
      </div>

      <PoemsClient />
    </PageShell>
  );
}
