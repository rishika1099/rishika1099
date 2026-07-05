"use client";

// In-place editor for the writing room: the full page (doors, featured card,
// neighboring corner) renders as-is, with only the intro editable.

import BlogHubClient from "@/components/BlogHubClient";
import { AdminGate } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";

function Editor({ keyVal }: { keyVal: string }) {
  const { ready, box, bar, field, preview } = usePassageEditor(
    keyVal,
    ["blog.title", "blog.intro", "blog.door.technical", "blog.door.poems", "blog.door.photography"],
    "/blog",
  );
  if (!ready)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;
  return (
    <>
      {bar}
      <div className="mx-auto mt-4 max-w-xl">
        {field("blog.title", "writing room title", "font-halimun text-3xl text-ink")}
      </div>
      <BlogHubClient
        title={preview("blog.title")}
        intro={box("blog.intro", "font-body text-lg text-ink-soft")}
        doorBlurbs={{
          technical: box("blog.door.technical", "font-body text-sm text-ink-soft"),
          poems: box("blog.door.poems", "font-body text-sm text-ink-soft"),
          photography: box("blog.door.photography", "font-body text-sm text-ink-soft"),
        }}
      />
    </>
  );
}

export default function BlogEdit() {
  return <AdminGate vibe="peach">{(key) => <Editor keyVal={key} />}</AdminGate>;
}
