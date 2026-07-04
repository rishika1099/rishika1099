"use client";

// In-place editor for the /now page: same layout, every section editable.

import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import { AdminGate } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";

const SECTIONS = [
  { id: "now.working", emoji: "🌱", title: "working on" },
  { id: "now.learning", emoji: "📚", title: "learning" },
  { id: "now.tinkering", emoji: "🛠️", title: "tinkering" },
  { id: "now.offclock", emoji: "🍵", title: "off the clock" },
];

function Editor({ keyVal }: { keyVal: string }) {
  const { ready, box, bar } = usePassageEditor(
    keyVal,
    ["now.intro", ...SECTIONS.map((s) => s.id), "now.tools"],
    "/now",
  );
  if (!ready)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;
  return (
    <PageShell vibe="dawn">
      {bar}
      <PageTitle>what i&apos;m up to, now 🧭</PageTitle>
      <div className="mt-3 max-w-2xl">{box("now.intro", "font-body text-lg text-ink-soft")}</div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <section key={s.id} className="rounded-3xl p-6 soft-card">
            <h2 className="font-body text-lg font-bold text-ink">
              <span className="mr-2">{s.emoji}</span>
              {s.title}
            </h2>
            <div className="mt-3">{box(s.id, "font-body text-sm text-ink-soft")}</div>
          </section>
        ))}
      </div>

      <h2 className="mt-10 font-body text-lg font-bold text-ink">🧰 tools i reach for daily</h2>
      <p className="mt-1 font-body text-[11px] text-ink-soft/60">comma-separated, each becomes a chip:</p>
      <div className="max-w-2xl">{box("now.tools", "font-body text-sm text-ink-soft")}</div>
    </PageShell>
  );
}

export default function NowEdit() {
  return <AdminGate vibe="dawn">{(key) => <Editor keyVal={key} />}</AdminGate>;
}
