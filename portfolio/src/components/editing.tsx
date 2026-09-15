"use client";

// Shared pieces for in-place page editing: the key gate, a sticky save bar,
// and a textarea that dresses up as the page's own typography.

import { useEffect, useRef } from "react";
import OwnerLogin from "@/components/OwnerLogin";
import PageShell from "@/components/PageShell";
import type { Vibe } from "@/components/Scenery";

/**
 * The edit rooms' door: the owner login (the key, then an emailed code on the
 * live site; the key alone on her machine). Renders children once open, with
 * the value their requests send.
 */
export function AdminGate({
  children,
  vibe,
}: {
  children: (key: string) => React.ReactNode;
  vibe?: Vibe;
}) {
  // pages that render their own shell only after unlock still get a backdrop
  return (
    <OwnerLogin scope="admin" storageKey="admin-key" shell={vibe ? (door) => <PageShell vibe={vibe}>{door}</PageShell> : undefined}>
      {(key) => children(key)}
    </OwnerLogin>
  );
}

/** Sticky bar with save / revert / view, shown while editing a page in place. */
export function SaveBar({
  saving,
  msg,
  onSave,
  onPublish,
  onMakeDefault,
  onRevert,
}: {
  saving: boolean;
  msg: string;
  onSave: () => void;
  /** save and leave edit mode (the site stops opening pages in /edit) */
  onPublish?: () => void;
  /** pin the current edits as the new default ("revert" returns here) */
  onMakeDefault?: () => void;
  onRevert?: () => void;
}) {
  return (
    <div className="sticky top-20 z-40 mx-auto mb-4 flex w-max max-w-[92vw] flex-wrap items-center justify-center gap-2 rounded-full px-4 py-2 soft-card">
      <span className="font-body text-sm font-semibold text-ink-soft">✎ editing this page</span>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-full bg-ink px-4 py-1.5 font-body text-sm font-semibold text-cream transition hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "saving…" : "save"}
      </button>
      {onPublish && (
        <button
          type="button"
          onClick={onPublish}
          disabled={saving}
          title="save and leave edit mode"
          className="rounded-full bg-blush px-4 py-1.5 font-body text-sm font-semibold text-ink transition hover:opacity-90 disabled:opacity-50"
        >
          ✦ publish
        </button>
      )}
      {onMakeDefault && (
        <button
          type="button"
          onClick={onMakeDefault}
          disabled={saving}
          title="pin the current words as the default; revert will come back here"
          className="rounded-full bg-white/70 px-4 py-1.5 font-body text-sm font-semibold text-ink-soft transition hover:bg-white disabled:opacity-50"
        >
          📌 make default
        </button>
      )}
      {onRevert && (
        <button
          type="button"
          onClick={onRevert}
          className="rounded-full bg-white/70 px-4 py-1.5 font-body text-sm font-semibold text-ink-soft transition hover:bg-white"
        >
          revert
        </button>
      )}
      {msg && <span className="font-body text-xs text-ink-soft">{msg}</span>}
    </div>
  );
}

/**
 * A textarea that wears the page's own typography, grows with its content,
 * and only reveals itself as editable with a soft dashed outline.
 */
export function EditableText({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      className={`block w-full resize-none overflow-hidden rounded-xl border border-dashed border-ink/20 bg-white/40 px-2 py-1 outline-none transition focus:border-blush focus:bg-white/70 ${className}`}
    />
  );
}

/** fetch wrapper that carries the admin key */
export function adminApi(key: string) {
  return async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", "x-admin-key": key, ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as T;
  };
}
