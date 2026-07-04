"use client";

import PassageEditPage from "@/components/PassageEditPage";

export default function BlogEdit() {
  return (
    <PassageEditPage
      vibe="peach"
      title="the writing room 📖"
      viewHref="/blog"
      passages={[
        { id: "blog.intro", textClass: "font-body text-lg text-ink-soft" },
      ]}
    />
  );
}
