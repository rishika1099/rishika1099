"use client";

// In-place editor for the home page (its URL is "/", so its editor lives at
// /edit, matching the /page/edit pattern everywhere else).

import PassageEditPage from "@/components/PassageEditPage";

export default function HomeEdit() {
  return (
    <PassageEditPage
      vibe="dawn"
      title="the little corner 🧋"
      viewHref="/"
      passages={[
        {
          id: "home.greeting",
          hint: "the greeting line above your photo",
          textClass: "font-serif text-lg italic text-ink-soft",
        },
        {
          id: "home.intro",
          hint: "the intro paragraph under your name",
          textClass: "font-body text-base text-ink-soft",
        },
      ]}
    />
  );
}
