"use client";

// In-place editor for pages whose editable content is one or two passages:
// same vibe and title as the real page, with the passage(s) as editable boxes.

import { useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import { AdminGate, EditableText, SaveBar, adminApi } from "@/components/editing";
import type { Vibe } from "@/components/Scenery";

export interface PassageSpec {
  id: string; // copy block id
  hint?: string;
  textClass: string; // typography matching the real page
}

export default function PassageEditPage({
  vibe,
  title,
  viewHref,
  passages,
}: {
  vibe: Vibe;
  title: string;
  viewHref: string;
  passages: PassageSpec[];
}) {
  return (
    <PageShell vibe={vibe}>
      <AdminGate>{(key) => <Editor keyVal={key} title={title} viewHref={viewHref} passages={passages} />}</AdminGate>
    </PageShell>
  );
}

function Editor({
  keyVal,
  title,
  viewHref,
  passages,
}: {
  keyVal: string;
  title: string;
  viewHref: string;
  passages: PassageSpec[];
}) {
  const api = adminApi(keyVal);
  const [texts, setTexts] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ blocks: { id: string; text: string }[] }>("/api/admin/copy")
      .then((d) => {
        const map: Record<string, string> = {};
        for (const p of passages) map[p.id] = d.blocks.find((b) => b.id === p.id)?.text ?? "";
        setTexts(map);
      })
      .catch(() => setMsg("couldn't load, refresh?"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!texts) return;
    setSaving(true);
    setMsg("");
    try {
      await api("/api/admin/copy", { method: "POST", body: JSON.stringify({ texts }) });
      setMsg("saved ✓ live now");
    } catch {
      setMsg("save failed, try again?");
    } finally {
      setSaving(false);
    }
  }

  if (!texts)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;

  return (
    <>
      <SaveBar saving={saving} msg={msg} onSave={save} viewHref={viewHref} />
      <PageTitle>{title}</PageTitle>
      {passages.map((p) => (
        <div key={p.id} className="mt-4 max-w-3xl">
          {p.hint && <p className="mb-1 font-body text-xs text-ink-soft/70">{p.hint}</p>}
          <EditableText
            value={texts[p.id]}
            onChange={(v) => setTexts({ ...texts, [p.id]: v })}
            className={p.textClass}
          />
        </div>
      ))}
    </>
  );
}
