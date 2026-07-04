"use client";

// In-place editor for the contact page: full page with the intro editable.

import ContactClient from "@/components/ContactClient";
import { AdminGate } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";

function Editor({ keyVal }: { keyVal: string }) {
  const { ready, box, bar } = usePassageEditor(keyVal, ["contact.intro"], "/contact");
  if (!ready)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;
  return (
    <>
      {bar}
      <ContactClient intro={box("contact.intro", "font-body text-lg text-ink-soft text-left")} />
    </>
  );
}

export default function ContactEdit() {
  return <AdminGate vibe="rose">{(key) => <Editor keyVal={key} />}</AdminGate>;
}
