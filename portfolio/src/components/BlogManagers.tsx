"use client";

// Blog editing shared by /blog/technical/edit and the atelier:
//  - RichPostManager: write/edit your own Medium-style posts (ink editor)
//  - AutoPostManager: override the title/subtitle/tags of auto-pulled posts

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InkEditor from "@/components/InkEditor";
import TagPicker from "@/components/TagPicker";
import { adminApi } from "@/components/editing";
import {
  categories as ALL_CATEGORIES,
  domains as ALL_DOMAINS,
  domainColor,
  type Domain,
} from "@/data/projects";
import type { RichPost } from "@/lib/richBlogs";

const btn =
  "rounded-full px-4 py-1.5 font-body text-sm font-semibold transition disabled:opacity-50";
const btnDark = `${btn} bg-ink text-cream hover:opacity-90`;
const btnSoft = `${btn} bg-white/70 text-ink-soft hover:bg-white`;
const btnDanger = `${btn} bg-rose/60 text-ink hover:bg-rose/80`;
const field =
  "w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-2 focus:ring-blush/30";

// ISO datetime <-> value for <input type="datetime-local"> (which is local, no tz)
function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(v: string): string {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

function StatusBadge({ post }: { post: RichPost }) {
  if (post.status === "draft")
    return (
      <span className="rounded-full bg-white/70 px-2 py-0.5 font-body text-[10px] font-semibold text-ink-soft">
        draft
      </span>
    );
  if (post.status === "scheduled") {
    const due = post.publishAt ? new Date(post.publishAt) : null;
    const live = !!due && due.getTime() <= Date.now();
    return (
      <span className="rounded-full bg-lavender/60 px-2 py-0.5 font-body text-[10px] font-semibold text-ink">
        {live ? "🌿 live" : `🕰 ${due ? due.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "scheduled"}`}
      </span>
    );
  }
  return null;
}

export function RichPostManager({ keyVal }: { keyVal: string }) {
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
      const done =
        editing.status === "draft"
          ? "saved as draft ✓"
          : editing.status === "scheduled"
            ? "scheduled ✓"
            : "published ✓";
      setEditing(null);
      setMsg(done);
      refresh();
      router.refresh();
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-body text-lg font-bold text-ink">✒️ your posts</h2>
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
            <p className="font-body text-sm text-ink-soft">nothing here yet, write your first one ✦</p>
          )}
          {posts?.map((p) => (
            <li
              key={p.slug}
              className="flex items-center justify-between gap-3 rounded-2xl bg-white/50 p-3"
            >
              <div>
                <p className="flex items-center gap-2 font-body text-sm font-bold text-ink">
                  {p.title}
                  <StatusBadge post={p} />
                </p>
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
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/50 p-3">
            <span className="font-body text-xs font-semibold text-ink-soft">visibility</span>
            {(["published", "draft", "scheduled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setEditing((e) => (e ? { ...e, status: s } : e))}
                className={`rounded-full px-3 py-1 font-body text-xs transition ${
                  (editing.status ?? "published") === s
                    ? "bg-ink text-cream"
                    : "bg-white/70 text-ink-soft hover:text-ink"
                }`}
              >
                {s === "published" ? "🌿 live" : s === "draft" ? "✎ draft" : "🕰 schedule"}
              </button>
            ))}
            {editing.status === "scheduled" && (
              <input
                type="datetime-local"
                className={`${field} sm:!w-56`}
                value={toLocalInput(editing.publishAt)}
                onChange={(e) =>
                  setEditing((ed) => (ed ? { ...ed, publishAt: fromLocalInput(e.target.value) } : ed))
                }
              />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={btnDark} onClick={save}>
              {editing.status === "draft"
                ? "save draft"
                : editing.status === "scheduled"
                  ? "schedule"
                  : "publish"}
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

interface AutoPost {
  slug: string;
  title: string;
  excerpt: string;
  external: string | null;
  tech: string[];
  domains: string[];
}
const pKey = (url?: string | null) => url?.match(/\/p\/([^/?#]+)/)?.[1] ?? "";

export function AutoPostManager({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const router = useRouter();
  const [posts, setPosts] = useState<AutoPost[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; excerpt: string; tech: string[]; domains: string[] } | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ posts: AutoPost[] }>("/api/admin/technical-posts")
      .then((d) => setPosts(d.posts.filter((p) => p.external && pKey(p.external))))
      .catch(() => setMsg("couldn't load the pulled posts"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(key: string) {
    if (!form) return;
    setMsg("saving…");
    try {
      await api("/api/admin/blog-overrides", {
        method: "POST",
        body: JSON.stringify({ key, title: form.title, excerpt: form.excerpt, tech: form.tech, domains: form.domains }),
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
    <div className="mt-6">
      <h2 className="font-body text-lg font-bold text-ink">
        🛰️ auto-pulled posts{" "}
        <span className="font-normal text-ink-soft">(clear a field + save = back to automatic)</span>
      </h2>
      {msg && <p className="mt-2 font-body text-sm text-ink-soft">{msg}</p>}
      <ul className="mt-3 space-y-1.5">
        {posts === null && <p className="font-body text-sm text-ink-soft">reaching for Substack… ✦</p>}
        {posts?.map((p) => {
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
