"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

interface Poem {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
}

interface Draft {
  originalSlug?: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
}

const blankDraft: Draft = { title: "", date: "", excerpt: "", content: "" };

export default function PoemEditor({ initialPoems }: { initialPoems: Poem[] }) {
  const router = useRouter();
  const [poems, setPoems] = useState<Poem[]>(initialPoems);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function refreshList() {
    const res = await fetch("/api/admin/poems");
    if (res.ok) {
      const data = await res.json();
      setPoems(data.poems ?? []);
    }
  }

  function startNew() {
    setError("");
    setNote("");
    setDraft({ ...blankDraft });
  }

  function startEdit(p: Poem) {
    setError("");
    setNote("");
    setDraft({
      originalSlug: p.slug,
      title: p.title,
      date: p.date,
      excerpt: p.excerpt,
      content: p.content,
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/poems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        await refreshList();
        setDraft(null);
        setNote("saved ✦");
        router.refresh();
      } else {
        setError(data.error || "Couldn't save");
      }
    } catch {
      setError("Something went sideways. Try again?");
    } finally {
      setBusy(false);
    }
  }

  async function remove(p: Poem) {
    if (!window.confirm(`Delete "${p.title}"? This can't be undone.`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/poems?slug=${encodeURIComponent(p.slug)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        await refreshList();
        setNote("removed ✦");
        router.refresh();
      } else {
        setError(data.error || "Couldn't delete");
      }
    } catch {
      setError("Something went sideways. Try again?");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={startNew}
          className="rounded-full bg-blush px-5 py-2.5 font-display font-semibold text-ink transition hover:scale-105"
        >
          + write a new poem
        </button>
        <button
          onClick={logout}
          className="font-body text-sm text-lavender/90 hover:text-white"
        >
          lock the desk
        </button>
      </div>

      {note && <p className="mt-3 font-body text-sm text-mint">{note}</p>}
      {error && <p className="mt-3 font-body text-sm text-[#ffb4c6]">{error}</p>}

      <AnimatePresence>
        {draft && (
          <motion.form
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={save}
            className="mt-5 rounded-[1.75rem] p-6 soft-card"
          >
            <label className="block font-body text-sm text-ink-soft">
              title
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="the title of your poem"
                autoFocus
                className="mt-1 w-full rounded-2xl border border-lavender bg-white/80 px-4 py-2.5 font-display text-lg text-ink outline-none focus:border-blush focus:ring-2 focus:ring-blush/40"
              />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block font-body text-sm text-ink-soft">
                date
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-lavender bg-white/80 px-4 py-2.5 font-body text-ink outline-none focus:border-blush focus:ring-2 focus:ring-blush/40"
                />
              </label>
              <label className="block font-body text-sm text-ink-soft">
                little excerpt
                <input
                  value={draft.excerpt}
                  onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
                  placeholder="a whisper of what's inside"
                  className="mt-1 w-full rounded-2xl border border-lavender bg-white/80 px-4 py-2.5 font-body text-ink outline-none focus:border-blush focus:ring-2 focus:ring-blush/40"
                />
              </label>
            </div>

            <label className="mt-4 block font-body text-sm text-ink-soft">
              the poem
              <textarea
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                placeholder="pour it out here… (markdown welcome)"
                rows={12}
                className="mt-1 w-full rounded-2xl border border-lavender bg-white/80 px-4 py-3 font-body leading-relaxed text-ink outline-none focus:border-blush focus:ring-2 focus:ring-blush/40"
              />
            </label>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="submit"
                disabled={busy || !draft.title || !draft.content}
                className="rounded-full bg-blush px-6 py-2.5 font-display font-semibold text-ink transition hover:scale-105 disabled:opacity-50"
              >
                {busy ? "saving…" : "save poem ✦"}
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="font-body text-sm text-ink-soft hover:text-ink"
              >
                cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <ul className="mt-7 flex flex-col gap-3">
        {poems.length === 0 && (
          <li className="font-body text-lavender/90">
            no poems yet — write your first one above ✦
          </li>
        )}
        {poems.map((p) => (
          <li
            key={p.slug}
            className="flex items-center justify-between gap-4 rounded-2xl bg-white/70 px-5 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-display text-lg text-ink">{p.title}</p>
              <p className="font-body text-xs text-ink-soft">{p.date}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                onClick={() => startEdit(p)}
                className="font-body text-sm text-ink-soft hover:text-ink"
              >
                edit
              </button>
              <button
                onClick={() => remove(p)}
                disabled={busy}
                className="font-body text-sm text-[#c0506b] hover:underline disabled:opacity-50"
              >
                delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
