"use client";

// In-place editor for the home page ("/" means its editor lives at /edit).
// The whole page renders exactly as visitors see it; only the greeting and
// intro are editable.

import HomeClient from "@/components/HomeClient";
import { AdminGate } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";

function Editor({ keyVal }: { keyVal: string }) {
  const { ready, box, bar } = usePassageEditor(
    keyVal,
    ["home.greeting", "home.intro"],
    "/",
  );
  if (!ready)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;
  return (
    <>
      {bar}
      <HomeClient
        greeting={box("home.greeting", "font-serif text-lg italic text-ink-soft sm:text-xl")}
        intro={box("home.intro", "font-body text-base text-ink-soft sm:text-lg")}
      />
    </>
  );
}

export default function HomeEdit() {
  return <AdminGate vibe="dawn">{(key) => <Editor keyVal={key} />}</AdminGate>;
}
