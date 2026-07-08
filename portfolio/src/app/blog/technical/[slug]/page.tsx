import Link from "next/link";
import { notFound } from "next/navigation";
import PostBody from "@/components/PostBody";
import PageShell from "@/components/PageShell";
import { getBlogPost, getBlogPosts } from "@/lib/content";
import ViewCount from "@/components/ViewCount";
import ReactionBar from "@/components/ReactionBar";

// one friendly date style (matches the technical index)
const fmtDate = (raw: string) => {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00`) : new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

// ~220 wpm is a comfortable technical reading pace
const readingMinutes = (text: string) =>
  Math.max(1, Math.round(text.split(/\s+/).filter(Boolean).length / 220));

export function generateStaticParams() {
  return getBlogPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  return { title: post ? post.title : "Post not found" };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    datePublished: post.date || undefined,
    url: `https://rishika-m.netlify.app/blog/technical/${post.slug}`,
    author: { "@type": "Person", name: "Rishika Mamidibathula" },
  };

  return (
    <PageShell vibe="azure">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/blog/technical"
        className="font-body text-sm text-ink-soft hover:text-ink"
      >
        ← all technical blogs
      </Link>
      <article className="mt-3 rounded-3xl p-7 soft-card sm:p-10">
        <p className="flex flex-wrap gap-x-1.5 font-body text-sm italic text-ink-soft">
          <span>{fmtDate(post.date)}</span>
          <span>· {readingMinutes(post.content)} min read ☕</span>
          <ViewCount path={`/blog/technical/${post.slug}`} />
        </p>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          {post.title}
        </h1>
        <div className="prose-soft mt-6 font-body text-ink">
          <PostBody content={post.content} />
        </div>
        <div className="mt-8 border-t border-ink/10 pt-6">
          <ReactionBar id={`post:${post.slug}`} />
        </div>
      </article>
    </PageShell>
  );
}
