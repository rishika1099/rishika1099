"use client";

// In-place editor for Technical Blogs: editable tagline, your own posts and the
// auto-pulled ones (shared managers), and the real list rendered below.

import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import TechnicalBlogList from "@/components/TechnicalBlogList";
import { RichPostManager, AutoPostManager } from "@/components/BlogManagers";
import { AdminGate } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";
import type { Doc } from "@/lib/content";

function Editor({ keyVal, posts }: { keyVal: string; posts: Doc[] }) {
  const { ready, box, bar } = usePassageEditor(keyVal, ["blog.technical.intro"], "/blog/technical");
  if (!ready)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;
  return (
    <PageShell vibe="azure">
      {bar}
      <PageTitle className="text-ink">technical blogs 📓</PageTitle>
      <div className="mt-3">
        <Link href="/blog" className="font-body text-sm text-ink-soft hover:text-ink">
          ← back to the writing room
        </Link>
      </div>
      <div className="mt-3 max-w-2xl">
        {box("blog.technical.intro", "font-body text-lg text-ink-soft")}
      </div>

      <div className="mt-8 rounded-3xl p-5 soft-card sm:p-6">
        <RichPostManager keyVal={keyVal} />
        <AutoPostManager keyVal={keyVal} />
      </div>

      <TechnicalBlogList posts={posts} />
    </PageShell>
  );
}

export default function TechnicalEditClient({ posts }: { posts: Doc[] }) {
  return <AdminGate vibe="azure">{(key) => <Editor keyVal={key} posts={posts} />}</AdminGate>;
}
