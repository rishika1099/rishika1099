"use client";

import PassageEditPage from "@/components/PassageEditPage";

export default function ContactEdit() {
  return (
    <PassageEditPage
      vibe="rose"
      title="let's say hello 💌"
      viewHref="/contact"
      passages={[
        { id: "contact.intro", textClass: "font-body text-lg text-ink-soft" },
      ]}
    />
  );
}
