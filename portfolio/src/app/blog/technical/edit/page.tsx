"use client";

import PassageEditPage from "@/components/PassageEditPage";

export default function TechnicalEdit() {
  return (
    <PassageEditPage
      vibe="azure"
      title="technical blogs 📓"
      viewHref="/blog/technical"
      passages={[
        { id: "blog.technical.intro", textClass: "font-body text-lg text-ink-soft" },
      ]}
    />
  );
}
