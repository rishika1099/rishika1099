import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import TechnicalBlogList from "@/components/TechnicalBlogList";
import { getBlogPosts } from "@/lib/content";
import { getSubstackPosts } from "@/lib/substack";

export const metadata = { title: "Technical Blogs" };
export const revalidate = 3600; // re-check Substack hourly

// the /p/<slug> part of a Substack URL, to dedupe against curated entries
const postSlug = (url?: string) => url?.match(/\/p\/([^/?#]+)/)?.[1];

export default async function TechnicalIndex() {
  const local = getBlogPosts();
  const localSlugs = new Set(local.map((p) => postSlug(p.external)).filter(Boolean));
  const substack = (await getSubstackPosts()).filter(
    (s) => !localSlugs.has(postSlug(s.external)),
  );
  const posts = [...local, ...substack].sort(
    (a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0),
  );
  return (
    <PageShell vibe="azure">
      <PageTitle className="text-ink">technical blogs 📓</PageTitle>
      <div className="mt-3">
        <Link href="/blog" className="font-body text-sm text-ink-soft hover:text-ink">
          ← back to the writing room
        </Link>
      </div>
      <p className="mt-3 max-w-2xl font-body text-lg text-ink-soft">
        ideas that refused to stay inside a notebook 💡
      </p>

      <TechnicalBlogList posts={posts} />
    </PageShell>
  );
}
