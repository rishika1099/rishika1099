"use client";

// Shared state for full-page in-place editing: load the requested copy
// blocks, hand back editable boxes to drop into the real page layout, and a
// save that jumps to the live page.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditableText, SaveBar, adminApi } from "@/components/editing";

export function usePassageEditor(keyVal: string, ids: string[], viewHref: string) {
  const api = adminApi(keyVal);
  const router = useRouter();
  const [texts, setTexts] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ blocks: { id: string; text: string }[] }>("/api/admin/copy")
      .then((d) => {
        const map: Record<string, string> = {};
        for (const id of ids) map[id] = d.blocks.find((b) => b.id === id)?.text ?? "";
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
      router.push(viewHref);
      router.refresh();
      return;
    } catch {
      setMsg("save failed, try again?");
    } finally {
      setSaving(false);
    }
  }

  const box = (id: string, className: string) =>
    texts === null ? null : (
      <EditableText
        value={texts[id]}
        onChange={(v) => setTexts({ ...texts, [id]: v })}
        className={className}
      />
    );

  const bar = <SaveBar saving={saving} msg={msg} onSave={save} viewHref={viewHref} />;

  return { ready: texts !== null, box, bar, texts };
}
