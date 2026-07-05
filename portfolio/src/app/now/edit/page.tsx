"use client";

// In-place editor for the /now page: same layout, every section editable.

import PageShell from "@/components/PageShell";
import { AdminGate } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";

const SECTIONS = [
  { id: "now.working", head: "now.head.working", emoji: "🌱" },
  { id: "now.learning", head: "now.head.learning", emoji: "📚" },
  { id: "now.tinkering", head: "now.head.tinkering", emoji: "🛠️" },
  { id: "now.offclock", head: "now.head.offclock", emoji: "🍵" },
];

function Editor({ keyVal }: { keyVal: string }) {
  const { ready, box, bar, titleBox } = usePassageEditor(
    keyVal,
    [
      "now.title",
      "now.intro",
      ...SECTIONS.flatMap((s) => [s.head, s.id]),
      "now.head.tools",
      "now.tools",
    ],
    "/now",
  );
  if (!ready)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;
  return (
    <PageShell vibe="dawn">
      {bar}
      {titleBox("now.title")}
      <div className="mt-3 max-w-2xl">{box("now.intro", "font-body text-lg text-ink-soft")}</div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <section key={s.id} className="rounded-3xl p-6 soft-card">
            <div className="flex items-center gap-2">
              <span className="text-lg">{s.emoji}</span>
              <div className="flex-1">{box(s.head, "font-body text-lg font-bold text-ink")}</div>
            </div>
            <div className="mt-3">{box(s.id, "font-body text-sm text-ink-soft")}</div>
          </section>
        ))}
      </div>

      <div className="mt-10 max-w-md">{box("now.head.tools", "font-body text-lg font-bold text-ink")}</div>
      <p className="mt-1 font-body text-[11px] text-ink-soft/60">comma-separated, each becomes a chip:</p>
      <div className="max-w-2xl">{box("now.tools", "font-body text-sm text-ink-soft")}</div>
    </PageShell>
  );
}

export default function NowEdit() {
  return <AdminGate vibe="dawn">{(key) => <Editor keyVal={key} />}</AdminGate>;
}
