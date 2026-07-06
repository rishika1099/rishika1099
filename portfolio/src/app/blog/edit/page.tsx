"use client";

// In-place editor for the writing room: the page renders as-is (the doors show
// their current blurbs), and the three door blurbs are edited in one tidy
// labeled section below, the same way the home landing cards work.

import BlogHubClient from "@/components/BlogHubClient";
import { AdminGate } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";

function Editor({ keyVal }: { keyVal: string }) {
  const { ready, box, bar, titleBox, field, preview } = usePassageEditor(
    keyVal,
    ["blog.title", "blog.intro", "blog.door.technical", "blog.door.poems", "blog.door.photography"],
    "/blog",
  );
  if (!ready)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;
  return (
    <>
      {bar}
      <BlogHubClient
        title={titleBox("blog.title")}
        intro={box("blog.intro", "font-body text-lg text-ink-soft")}
        doorBlurbs={{
          technical: preview("blog.door.technical"),
          poems: preview("blog.door.poems"),
          photography: preview("blog.door.photography"),
        }}
      />

      <div className="mx-auto mt-10 max-w-xl rounded-3xl p-5 soft-card">
        <p className="font-body text-sm font-bold text-ink">the three doors</p>
        <p className="mb-2 font-body text-[11px] text-ink-soft/60">
          each door&apos;s little blurb (the doors themselves are fixed):
        </p>
        {field("blog.door.technical", "📓 Technical Blogs", "font-body text-sm text-ink-soft")}
        {field("blog.door.poems", "🕯️ Poems", "font-body text-sm text-ink-soft")}
        {field("blog.door.photography", "📷 Photography", "font-body text-sm text-ink-soft")}
      </div>
    </>
  );
}

export default function BlogEdit() {
  return <AdminGate vibe="peach">{(key) => <Editor keyVal={key} />}</AdminGate>;
}
