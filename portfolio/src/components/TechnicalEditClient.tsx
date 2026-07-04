"use client";

// In-place editor for Technical Blogs: the tagline is editable, your own
// posts can be written Medium-style in the ink editor, and the real list
// renders below so the page looks exactly as visitors see it.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import TechnicalBlogList from "@/components/TechnicalBlogList";
import InkEditor from "@/components/InkEditor";
import { AdminGate, adminApi } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";
import type { Doc } from "@/lib/content";
import type { RichPost } from "@/lib/richBlogs";
import TagPicker from "@/components/TagPicker";
import { categories as ALL_CATEGORIES, domains as ALL_DOMAINS, domainColor, type Domain } from "@/data/projects";

const btn =
  "rounded-full px-4 py-1.5 font-body text-sm font-semibold transition disabled:opacity-50";
const btnDark = `${btn} bg-ink text-cream hover:opacity-90`;
const btnSoft = `${btn} bg-white/70 text-ink-soft hover:bg-white`;
const btnDanger = `${btn} bg-rose/60 text-ink hover:bg-rose/80`;
const field =
  "w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-2 focus:ring-blush/30";

function RichPostManager({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const router = useRouter();
  const [posts, setPosts] = useState<RichPost[] | null>(null);
  const [editing, setEditing] = useState<RichPost | null>(null);
  const [msg, setMsg] = useState("");

  const refresh = () =>
    api<{ posts: RichPost[] }>("/api/admin/blogs")
      .then((d) => setPosts(d.posts))
      .catch(() => setMsg("couldn't load your posts"));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!editing) return;
    setMsg("saving…");
    try {
      await api("/api/admin/blogs", { method: "POST", body: JSON.stringify(editing) });
      setEditing(null);
      setMsg("published ✓");
      refresh();
      router.refresh(); // the list below is server-rendered
    } catch {
      setMsg("save failed, it needs a title and a body");
    }
  }

  async function remove(slug: string) {
    if (!confirm(`Delete "${slug}"?`)) return;
    await api("/api/admin/blogs", { method: "DELETE", body: JSON.stringify({ slug }) });
    setEditing(null);
    refresh();
    router.refresh();
  }

  return (
    <div className="mt-8 rounded-3xl p-5 soft-card sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-body text-lg font-bold text-ink">✒️ your posts (ink editor)</h2>
        {!editing && (
          <button
            className={btnDark}
            onClick={() =>
              setEditing({
                slug: "",
                title: "",
                date: new Date().toISOString().slice(0, 10),
                excerpt: "",
                html: "",
              })
            }
          >
            ＋ new post
          </button>
        )}
      </div>
      {msg && <p className="mt-2 font-body text-sm text-ink-soft">{msg}</p>}

      {!editing ? (
        <ul className="mt-3 space-y-2">
          {posts === null && <p className="font-body text-sm text-ink-soft">opening the desk… ✦</p>}
          {posts?.length === 0 && (
            <p className="font-body text-sm text-ink-soft">
              nothing here yet, write your first one ✦
            </p>
          )}
          {posts?.map((p) => (
            <li key={p.slug} className="flex items-center justify-between gap-3 rounded-2xl bg-white/50 p-3">
              <div>
                <p className="font-body text-sm font-bold text-ink">{p.title}</p>
                <p className="font-body text-xs italic text-ink-soft">{p.date}</p>
              </div>
              <button className={btnSoft} onClick={() => setEditing({ ...p })}>
                ✎ edit
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 space-y-3">
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
              placeholder="one-line excerpt (auto-filled from the body if empty)"
              value={editing.excerpt}
              onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
            />
          </div>
          <InkEditor
            initialHtml={editing.html}
            onChange={(html) => setEditing((e) => (e ? { ...e, html } : e))}
            placeholder="write like nobody's compiling…"
          />
          <div className="flex flex-wrap gap-2">
            <button className={btnDark} onClick={save}>
              publish
            </button>
            <button className={btnSoft} onClick={() => setEditing(null)}>
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

const pKey = (url?: string) => url?.match(/\/p\/([^/?#]+)/)?.[1] ?? "";

function AutoPostManager({ keyVal, posts }: { keyVal: string; posts: Doc[] }) {
  const api = adminApi(keyVal);
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; excerpt: string; tech: string[]; domains: string[] } | null>(null);
  const [msg, setMsg] = useState("");
  const auto = posts.filter((p) => p.external && pKey(p.external));

  async function save(key: string) {
    if (!form) return;
    setMsg("saving…");
    try {
      await api("/api/admin/blog-overrides", {
        method: "POST",
        body: JSON.stringify({
          key,
          title: form.title,
          excerpt: form.excerpt,
          tech: form.tech,
          domains: form.domains,
        }),
      });
      setOpen(null);
      setForm(null);
      setMsg("saved ✓");
      router.refresh();
    } catch {
      setMsg("save failed, try again?");
    }
  }

  return (
    <div className="mt-6 rounded-3xl p-5 soft-card sm:p-6">
      <h2 className="font-body text-lg font-bold text-ink">
        🛰️ auto-pulled posts{" "}
        <span className="font-normal text-ink-soft">(clear a field + save = back to automatic)</span>
      </h2>
      {msg && <p className="mt-2 font-body text-sm text-ink-soft">{msg}</p>}
      <ul className="mt-3 space-y-1.5">
        {auto.map((p) => {
          const key = pKey(p.external);
          return (
            <li
              key={key}
              className={`rounded-2xl p-2.5 transition ${
                open === key ? "bg-blush/25 ring-2 ring-blush shadow-md" : "bg-white/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate font-body text-sm font-semibold text-ink">{p.title}</span>
                <button
                  className={btnSoft}
                  onClick={() => {
                    if (open === key) {
                      setOpen(null);
                      setForm(null);
                    } else {
                      setOpen(key);
                      setForm({
                        title: p.title,
                        excerpt: p.excerpt,
                        tech: [...(p.tech ?? [])],
                        domains: [...(p.domains ?? [])],
                      });
                    }
                  }}
                >
                  {open === key ? "close" : "✎ edit"}
                </button>
              </div>
              {open === key && form && (
                <div className="mt-3 space-y-2 border-t border-ink/10 pt-3">
                  <input className={field} placeholder="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  <textarea className={`${field} min-h-16`} placeholder="subtitle / excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
                  <p className="font-body text-[11px] font-semibold text-ink-soft">tech areas, tap what applies</p>
                  <TagPicker options={ALL_CATEGORIES} value={form.tech} onChange={(v) => setForm({ ...form, tech: v })} />
                  <p className="font-body text-[11px] font-semibold text-ink-soft">domains, tap what applies</p>
                  <TagPicker options={ALL_DOMAINS} value={form.domains} onChange={(v) => setForm({ ...form, domains: v })} colorFor={(t) => domainColor[t as Domain]} />
                  <button className={btnDark} onClick={() => save(key)}>save</button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Editor({ keyVal, posts }: { keyVal: string; posts: Doc[] }) {
  const { ready, box, bar } = usePassageEditor(keyVal, ["blog.technical.intro"], "/blog/technical");
  if (!ready)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;
  return (
    <PageShell vibe="azure">
      {bar}
      <PageTitle className="text-ink">technical blogs 📓</PageTitle>
      <div className="mt-3">
        <Link href="/blog" className="font-body text-sm text-ink-soft hover:text-ink">
          ← back to the writing room
        </Link>
      </div>
      <div className="mt-3 max-w-2xl">{box("blog.technical.intro", "font-body text-lg text-ink-soft")}</div>

      <RichPostManager keyVal={keyVal} />
      <AutoPostManager keyVal={keyVal} posts={posts} />

      <TechnicalBlogList posts={posts} />
    </PageShell>
  );
}

export default function TechnicalEditClient({ posts }: { posts: Doc[] }) {
  return <AdminGate vibe="azure">{(key) => <Editor keyVal={key} posts={posts} />}</AdminGate>;
}
