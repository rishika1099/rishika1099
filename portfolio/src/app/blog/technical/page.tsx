import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import TechnicalBlogList from "@/components/TechnicalBlogList";
import { getTechnicalPosts } from "@/lib/technicalPosts";
import { getCopy } from "@/lib/siteCopy";
import { copyToHtml } from "@/lib/copyRender";

export const metadata = { title: "Technical Blogs" };
// copy edits go live instantly; the Substack fetch keeps its own hourly cache
export const dynamic = "force-dynamic";

export default async function TechnicalIndex() {
  const copy = await getCopy();
  const posts = await getTechnicalPosts();
  return (
    <PageShell vibe="azure">
      <PageTitle className="text-ink">technical blogs 📓</PageTitle>
      <div className="mt-3">
        <Link href="/blog" className="font-body text-sm text-ink-soft hover:text-ink">
          ← back to the writing room
        </Link>
      </div>
      <p className="mt-3 max-w-2xl font-body text-lg text-ink-soft">
        <span className="rich-passage" dangerouslySetInnerHTML={{ __html: copyToHtml(copy["blog.technical.intro"]) }} />
      </p>

      <TechnicalBlogList posts={posts} />
    </PageShell>
  );
}
