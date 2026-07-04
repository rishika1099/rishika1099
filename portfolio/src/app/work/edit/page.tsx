"use client";

import PassageEditPage from "@/components/PassageEditPage";

export default function WorkEdit() {
  return (
    <PassageEditPage
      vibe="meadow"
      title="my little meadow of projects 🌱"
      viewHref="/work"
      passages={[
        {
          id: "work.intro",
          hint: "{count} becomes the live project count",
          textClass: "font-body text-lg text-ink-soft",
        },
      ]}
    />
  );
}
