import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import PhotoGallery from "@/components/PhotoGallery";
import { getPhotoData } from "@/lib/photos";
import { getCopy } from "@/lib/siteCopy";
import { copyToHtml } from "@/lib/copyRender";

export const metadata = { title: "Photography" };
export const dynamic = "force-dynamic";

export default async function Photography() {
  const [{ groups, silhouette }, copy] = await Promise.all([getPhotoData(), getCopy()]);
  const grouped = silhouette !== null && groups.length > 1;
  return (
    <PageShell vibe="sunset">
      <PageTitle className="text-ink">photography 📷</PageTitle>
      <div className="mt-3">
        <Link href="/blog" className="font-body text-sm text-ink-soft hover:text-ink">
          ← back to the writing room
        </Link>
      </div>
      <p className="mt-3 max-w-2xl font-body text-lg text-ink-soft">
        <span className="rich-passage" dangerouslySetInnerHTML={{ __html: copyToHtml(copy["photography.intro"]) }} />
      </p>
      {grouped && (
        <p className="mt-2 max-w-2xl font-body text-xs text-ink-soft/80">
          auto-grouped into {groups.length} themes by embedding the images with
          CLIP and running k-means (silhouette {silhouette}) ✦
        </p>
      )}

      <PhotoGallery groups={groups} />

      <p className="mt-14 text-center font-body text-xs text-ink-soft">
        <span className="mr-1.5">©</span>
        {new Date().getFullYear()}{" "}
        Rishika Mamidibathula. These photos are my own, shared here with love.
        Please don&apos;t reproduce or repost them without permission. ✦
      </p>
    </PageShell>
  );
}
