"use client";

// In-place editor for the tour article: the full article renders (stats,
// bars, demo and all) with every prose passage as an ink-editor box.

import UnderTheHoodArticle from "@/components/UnderTheHoodArticle";
import InkEditor from "@/components/InkEditor";
import { AdminGate } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";
import { copyDefaults } from "@/data/copy";

const TOUR_IDS = Object.keys(copyDefaults).filter((id) => id.startsWith("tour."));

function Editor({ keyVal }: { keyVal: string }) {
  const { ready, bar, texts, setText } = usePassageEditor(
    keyVal,
    TOUR_IDS,
    "/blog/technical/under-the-hood",
  );
  if (!ready || !texts)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;
  return (
    <>
      {bar}
      <UnderTheHoodArticle
        titleNode={
          <span className="rich-passage" dangerouslySetInnerHTML={{ __html: texts["tour.title"] ?? "" }} />
        }
        renderSlot={(id, className) => (
          <InkEditor
            initialHtml={texts[id] ?? ""}
            onChange={(v) => setText(id, v)}
            compact
            surfaceClassName={className || "font-body text-[15px] leading-relaxed text-ink"}
            placeholder="write here…"
          />
        )}
      />
    </>
  );
}

export default function TourEdit() {
  return <AdminGate vibe="aurora">{(key) => <Editor keyVal={key} />}</AdminGate>;
}
