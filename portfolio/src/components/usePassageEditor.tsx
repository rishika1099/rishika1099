"use client";

// Shared state for full-page in-place editing: load the requested copy
// blocks, hand back editable boxes to drop into the real page layout, and a
// save that jumps to the live page.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SaveBar, adminApi } from "@/components/editing";
import InkEditor from "@/components/InkEditor";

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

  // pin this page's current words as the new default, so "revert" returns here
  async function makeDefault() {
    if (!texts) return;
    if (!confirm('Make this page\'s current words the default? "Revert" will come back here.')) return;
    setSaving(true);
    setMsg("");
    try {
      await api("/api/admin/copy", { method: "POST", body: JSON.stringify({ texts }) });
      await api("/api/admin/copy", {
        method: "POST",
        body: JSON.stringify({ promote: true, ids }),
      });
      setMsg("pinned as the default ✓");
    } catch {
      setMsg("couldn't pin, try again?");
    } finally {
      setSaving(false);
    }
  }

  // revert just this page's blocks to the default (pinned baseline, else code)
  async function revert() {
    if (!confirm("Revert this page to the default words?")) return;
    setSaving(true);
    setMsg("");
    try {
      await api(`/api/admin/copy?ids=${encodeURIComponent(ids.join(","))}`, { method: "DELETE" });
      const d = await api<{ blocks: { id: string; text: string }[] }>("/api/admin/copy");
      const map: Record<string, string> = {};
      for (const id of ids) map[id] = d.blocks.find((b) => b.id === id)?.text ?? "";
      setTexts(map);
      setMsg("reverted to the default ✓");
    } catch {
      setMsg("couldn't revert, try again?");
    } finally {
      setSaving(false);
    }
  }

  const box = (id: string, className: string) =>
    texts === null ? null : (
      <InkEditor
        initialHtml={texts[id]}
        onChange={(v) => setTexts((t) => (t ? { ...t, [id]: v } : t))}
        compact
        surfaceClassName={className}
        placeholder="write here…"
      />
    );

  // a plain live-preview span, safe to drop inside an <h1>/<span> where the
  // editor <div> can't go (div-in-heading would break hydration)
  const preview = (id: string, className = "") =>
    texts === null ? null : (
      <span
        className={`rich-passage ${className}`}
        dangerouslySetInnerHTML={{ __html: texts[id] }}
      />
    );

  // a labeled editor block to sit outside a heading, so titles stay editable
  const field = (id: string, label: string, className: string) =>
    texts === null ? null : (
      <div className="mx-auto mb-2 max-w-xl">
        <p className="mb-1 font-body text-[11px] font-semibold uppercase tracking-wide text-ink-soft/70">
          {label}
        </p>
        {box(id, className)}
      </div>
    );

  const bar = (
    <SaveBar
      saving={saving}
      msg={msg}
      onSave={save}
      onMakeDefault={makeDefault}
      onRevert={revert}
      viewHref={viewHref}
    />
  );

  const setText = (id: string, v: string) => setTexts((t) => (t ? { ...t, [id]: v } : t));

  return { ready: texts !== null, box, bar, texts, setText, preview, field };
}
