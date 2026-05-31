import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import PhotoGallery from "@/components/PhotoGallery";
import { listPhotos } from "@/lib/photos";

export const metadata = { title: "Photography" };

export default function Photography() {
  const photos = listPhotos();
  return (
    <PageShell vibe="sunset">
      <Link href="/blog" className="font-body text-sm text-ink-soft hover:text-ink">
        ← back to the writing room
      </Link>
      <PageTitle className="mt-2 text-ink">photography 📷</PageTitle>
      <p className="mt-3 max-w-2xl font-body text-lg text-ink-soft">
        Light I caught and kept.{" "}
        {photos.length === 0 && (
          <>
            (These are placeholder frames, drop photos into{" "}
            <code className="rounded bg-white/60 px-1">/public/photos</code> and run{" "}
            <code className="rounded bg-white/60 px-1">npm run media</code> to caption
            them.)
          </>
        )}
      </p>

      <PhotoGallery photos={photos} />
    </PageShell>
  );
}
