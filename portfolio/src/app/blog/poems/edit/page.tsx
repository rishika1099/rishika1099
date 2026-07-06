"use client";

// The poem desk: write and edit poems Medium-style in the ink editor, in the
// same twilight the poem room lives in. Art + mood generate on first view.

import Link from "next/link";
import { useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import InkEditor from "@/components/InkEditor";
import PoemArtManager from "@/components/PoemArtManager";
import { AdminGate, adminApi } from "@/components/editing";

interface Poem {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  rich?: boolean;
}

const btn =
  "rounded-full px-4 py-1.5 font-body text-sm font-semibold transition disabled:opacity-50";
const btnLight = `${btn} bg-cream text-ink hover:opacity-90`;
const btnGhost = `${btn} bg-white/15 text-cream hover:bg-white/25`;
const btnDanger = `${btn} bg-rose/70 text-ink hover:bg-rose/90`;
const field =
  "w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2 font-body text-sm text-cream outline-none placeholder:text-cream/40 focus:border-blush/60";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function Desk({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const [poems, setPoems] = useState<Poem[] | null>(null);
  const [editing, setEditing] = useState<Poem | null>(null);
  const [msg, setMsg] = useState("");

  const refresh = () =>
    api<{ poems: Poem[] }>("/api/admin/poems")
      .then((d) => setPoems(d.poems))
      .catch(() => setMsg("couldn't open the drawer"));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!editing) return;
    setMsg("saving…");
    try {
      await api("/api/admin/poems", {
        method: "POST",
        body: JSON.stringify({ ...editing, rich: true }),
      });
      setEditing(null);
      setMsg("tucked away ✓ (art + mood bloom on first view)");
      refresh();
    } catch {
      setMsg("save failed, it needs a title and the poem itself");
    }
  }

  async function remove(slug: string) {
    if (!confirm(`Let "${slug}" go? This can't be undone.`)) return;
    await api("/api/admin/poems", { method: "DELETE", body: JSON.stringify({ slug }) });
    setEditing(null);
    refresh();
  }

  // plain older poems open in the ink editor as escaped lines
  const toHtml = (p: Poem) =>
    p.rich ? p.content : escapeHtml(p.content).replace(/\n/g, "<br>");

  if (!poems)
    return <p className="mt-8 font-body text-sm text-cream/70">lighting the candle… 🕯️</p>;

  return (
    <div className="mt-8">
      {msg && <p className="mb-3 font-body text-sm text-cream/80">{msg}</p>}
      {!editing ? (
        <>
          <button
            className={btnLight}
            onClick={() =>
              setEditing({
                slug: "",
                title: "",
                date: new Date().toISOString().slice(0, 10),
                excerpt: "",
                content: "",
                rich: true,
              })
            }
          >
            ＋ new poem
          </button>
          <ul className="mt-5 space-y-2">
            {poems.map((p) => (
              <li
                key={p.slug}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div>
                  <p className="font-body text-sm font-bold text-cream">{p.title}</p>
                  <p className="font-body text-xs italic text-cream/60">{p.date}</p>
                </div>
                <button className={btnGhost} onClick={() => setEditing({ ...p, content: toHtml(p) })}>
                  ✎ edit
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="space-y-3">
          <input
            className={field}
            placeholder="title"
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className={`${field} sm:!w-44`}
              placeholder="YYYY-MM-DD"
              value={editing.date}
              onChange={(e) => setEditing({ ...editing, date: e.target.value })}
            />
            <input
              className={field}
              placeholder="one-line excerpt (shows on the card)"
              value={editing.excerpt}
              onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
            />
          </div>
          <InkEditor
            initialHtml={editing.content}
            onChange={(html) => setEditing((p) => (p ? { ...p, content: html } : p))}
            placeholder="midnight thoughts go here…"
            minHeight="20rem"
            dark
            surfaceClassName="prose-poem font-serif text-lg leading-relaxed text-cream"
          />
          <p className="font-body text-xs text-cream/60">
            this writes just like the poem room, no need to set a font or colour ✦
          </p>
          {editing.slug ? (
            <PoemArtManager slug={editing.slug} keyVal={keyVal} dark />
          ) : (
            <p className="font-body text-xs text-cream/50">
              save the poem first, then its artwork controls appear here ✦
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button className={btnLight} onClick={save}>
              save
            </button>
            <button className={btnGhost} onClick={() => setEditing(null)}>
              cancel
            </button>
            {editing.slug && (
              <button className={btnDanger} onClick={() => remove(editing.slug)}>
                delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PoemsEdit() {
  return (
    <PageShell vibe="twilight">
      <PageTitle className="text-cream">the poem desk 🕯️</PageTitle>
      <div className="mt-3">
        <Link href="/blog/poems" className="font-body text-sm text-cream/60 hover:text-cream">
          → the locked room itself
        </Link>
      </div>
      <AdminGate>{(key) => <Desk keyVal={key} />}</AdminGate>
    </PageShell>
  );
}
