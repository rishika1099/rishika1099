"use client";

// In-place editor for the writing room: the full page (doors, featured card,
// neighboring corner) renders as-is, with only the intro editable.

import BlogHubClient from "@/components/BlogHubClient";
import { AdminGate } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";

function Editor({ keyVal }: { keyVal: string }) {
  const { ready, box, bar } = usePassageEditor(keyVal, ["blog.intro"], "/blog");
  if (!ready)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;
  return (
    <>
      {bar}
      <BlogHubClient intro={box("blog.intro", "font-body text-lg text-ink-soft")} />
    </>
  );
}

export default function BlogEdit() {
  return <AdminGate vibe="peach">{(key) => <Editor keyVal={key} />}</AdminGate>;
}
