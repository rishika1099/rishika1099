import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import { getRichPost } from "@/lib/richBlogs";

// posts written in the atelier live in Blobs, so always render fresh
export const dynamic = "force-dynamic";

const fmtDate = (raw: string) => {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00`) : new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

export default async function RichPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getRichPost(slug);
  if (!post) notFound();

  return (
    <PageShell vibe="azure">
      <Link href="/blog/technical" className="font-body text-sm text-ink-soft hover:text-ink">
        ← all technical blogs
      </Link>
      <article className="mt-3 rounded-3xl p-7 soft-card sm:p-10">
        <p className="font-body text-sm italic text-ink-soft">{fmtDate(post.date)}</p>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">{post.title}</h1>
        <div
          className="prose-soft mt-6 font-body text-ink"
          // sanitized at save time; only the key-holder can write it
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>
    </PageShell>
  );
}
