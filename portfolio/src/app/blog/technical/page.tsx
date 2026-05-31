import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import { getBlogPosts } from "@/lib/content";

export const metadata = { title: "Technical Blogs — Rishika" };

export default function TechnicalIndex() {
  const posts = getBlogPosts();
  return (
    <PageShell vibe="meadow">
      <Link href="/blog" className="font-body text-sm text-ink-soft hover:text-ink">
        ← back to the writing room
      </Link>
      <PageTitle className="mt-2 text-ink">technical blogs 📓</PageTitle>
      <p className="mt-3 max-w-2xl font-body text-lg text-ink-soft">
        Things I figured out and wanted to remember out loud.
      </p>

      <div className="mt-8 space-y-4">
        {posts.length === 0 && (
          <p className="font-hand text-xl text-ink-soft">
            no posts yet — they&apos;re still brewing ☕
          </p>
        )}
        {posts.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/technical/${p.slug}`}
            className="block rounded-3xl p-6 soft-card transition hover:-translate-y-1"
          >
            <p className="font-hand text-lg text-ink-soft">{p.date}</p>
            <h2 className="font-display text-xl font-semibold text-ink">
              {p.title}
            </h2>
            <p className="mt-1 font-body text-sm text-ink-soft">{p.excerpt}</p>
            <span className="mt-2 inline-block font-body text-sm font-semibold text-[#c77dba]">
              read on →
            </span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
