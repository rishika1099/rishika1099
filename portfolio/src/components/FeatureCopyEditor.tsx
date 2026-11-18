"use client";
import { featureCopyDefaults } from "@/data/copy";
import { usePassageEditor } from "./usePassageEditor";
export default function FeatureCopyEditor({ page, keyVal }: { page: string; keyVal: string }) {
  const blocks = Object.entries(featureCopyDefaults).filter(([, block]) => block.page === page);
  const { ready, texts, setText, bar } = usePassageEditor(keyVal, blocks.map(([key]) => key), page === "contact" ? "/contact" : page === "blog" ? "/blog" : `/blog/${page}`);
  if (!ready) return null;
  return <div className="mx-auto my-8 w-full min-w-0 max-w-3xl rounded-3xl bg-white/90 p-5 text-ink [&>div:first-child]:max-w-full">
    {bar}
    <div className="grid gap-4 sm:grid-cols-2">{blocks.map(([key, block]) => <label key={key} className="min-w-0 font-body text-sm">
      {block.label}<textarea aria-label={block.label} className="mt-1 block min-h-20 w-full rounded-xl border border-ink/20 p-2" value={texts?.[key] ?? ""} onChange={event => setText(key, event.target.value)} />
    </label>)}</div>
  </div>;
}
