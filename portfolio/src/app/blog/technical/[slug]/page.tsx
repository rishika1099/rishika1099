import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PageShell from "@/components/PageShell";
import { getBlogPost, getBlogPosts } from "@/lib/content";

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

  return (
    <PageShell vibe="meadow">
      <Link
        href="/blog/technical"
        className="font-body text-sm text-ink-soft hover:text-ink"
      >
        ← all technical blogs
      </Link>
      <article className="mt-3 rounded-3xl p-7 soft-card sm:p-10">
        <p className="font-hand text-lg text-ink-soft">{post.date}</p>
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">
          {post.title}
        </h1>
        <div className="prose-soft mt-6 font-body text-ink">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>
      </article>
    </PageShell>
  );
}
