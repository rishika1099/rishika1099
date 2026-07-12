"use client";

// Shared pieces for in-place page editing: the key gate, a sticky save bar,
// and a textarea that dresses up as the page's own typography.

import { useEffect, useRef, useState } from "react";
import PageShell from "@/components/PageShell";
import type { Vibe } from "@/components/Scenery";

/** Key gate: renders children only once the admin key is known-good. */
export function AdminGate({
  children,
  vibe,
}: {
  children: (key: string) => React.ReactNode;
  vibe?: Vibe;
}) {
  const [key, setKey] = useState("");
  const [entered, setEntered] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("admin-key");
    if (saved) {
      setKey(saved);
      setEntered(true);
    }
  }, []);

  async function tryKey(k: string) {
    setErr("");
    const res = await fetch("/api/admin/copy", { headers: { "x-admin-key": k } });
    if (res.status === 401) return setErr("that's not the key 🌙");
    if (res.status === 503) return setErr("ADMIN_KEY isn't configured on this deploy yet.");
    if (!res.ok) return setErr("something wobbled, try again?");
    localStorage.setItem("admin-key", k);
    setEntered(true);
  }

  if (entered) return <>{children(key)}</>;
  const gate = (
    <>
      <form
        className="mx-auto mt-8 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (key.trim()) tryKey(key.trim());
        }}
      >
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="the key"
          className="w-full rounded-full border border-white/70 bg-white/80 px-5 py-2.5 font-body text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-2 focus:ring-blush/30"
        />
        <button
          type="submit"
          className="rounded-full bg-ink px-6 py-2.5 font-body font-semibold text-cream transition hover:opacity-90"
        >
          open
        </button>
      </form>
      {err && <p className="mt-3 text-center font-body text-sm text-rose-500">{err}</p>}
    </>
  );
  // pages that render their own shell only after unlock still get a backdrop
  return vibe ? <PageShell vibe={vibe}>{gate}</PageShell> : gate;
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
