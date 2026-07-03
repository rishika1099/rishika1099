"use client";

// The secret /edit room: LinkedIn-style editing for poems, photos, and the
// About journey. Everything writes through key-gated admin APIs into Netlify
// Blobs (or local files in dev), so edits go live with no rebuild.

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import type { Entry } from "@/data/about";

interface Poem {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
}
interface Photo {
  src: string;
  caption: string;
}

const field =
  "w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-2 focus:ring-blush/30";
const btn =
  "rounded-full px-4 py-1.5 font-body text-sm font-semibold transition disabled:opacity-50";
const btnDark = `${btn} bg-ink text-cream hover:opacity-90`;
const btnSoft = `${btn} bg-white/70 text-ink-soft hover:bg-white`;
const btnDanger = `${btn} bg-rose/60 text-ink hover:bg-rose/80`;

function useAdminApi(key: string) {
  return async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": key,
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as T;
  };
}

/* ---------------- poems ---------------- */

function PoemsTab({ keyVal }: { keyVal: string }) {
  const api = useAdminApi(keyVal);
  const [poems, setPoems] = useState<Poem[] | null>(null);
  const [editing, setEditing] = useState<Poem | null>(null);
  const [msg, setMsg] = useState("");

  const refresh = () =>
    api<{ poems: Poem[] }>("/api/admin/poems").then((d) => setPoems(d.poems)).catch(() => setMsg("couldn't load poems"));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!editing) return;
    setMsg("saving…");
    try {
      await api("/api/admin/poems", { method: "POST", body: JSON.stringify(editing) });
      setEditing(null);
      setMsg("saved ✓ (art + mood generate on first view)");
      refresh();
    } catch {
      setMsg("save failed, is the title + poem filled in?");
    }
  }

  async function remove(slug: string) {
    if (!confirm(`Delete "${slug}"? This can't be undone.`)) return;
    await api("/api/admin/poems", { method: "DELETE", body: JSON.stringify({ slug }) });
    setEditing(null);
    refresh();
  }

  if (!poems) return <p className="mt-6 font-body text-sm text-ink-soft">opening the drawer… ✦</p>;

  return (
    <div className="mt-6">
      {msg && <p className="mb-3 font-body text-sm text-ink-soft">{msg}</p>}
      {!editing ? (
        <>
          <button
            className={btnDark}
            onClick={() =>
              setEditing({ slug: "", title: "", date: new Date().toISOString().slice(0, 10), excerpt: "", content: "" })
            }
          >
            ＋ new poem
          </button>
          <ul className="mt-4 space-y-2">
            {poems.map((p) => (
              <li key={p.slug} className="flex items-center justify-between gap-3 rounded-2xl p-4 soft-card">
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
        </>
      ) : (
        <div className="space-y-3 rounded-3xl p-5 soft-card">
          <input className={field} placeholder="title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          <div className="flex gap-3">
            <input className={field} placeholder="YYYY-MM-DD" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            <input className={field} placeholder="one-line excerpt (shows on the card)" value={editing.excerpt} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
          </div>
          <textarea className={`${field} min-h-56 font-serif`} placeholder="the poem…" value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} />
          <div className="flex flex-wrap gap-2">
            <button className={btnDark} onClick={save}>save</button>
            <button className={btnSoft} onClick={() => setEditing(null)}>cancel</button>
            {editing.slug && (
              <button className={btnDanger} onClick={() => remove(editing.slug)}>delete</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- photos ---------------- */

function PhotosTab({ keyVal }: { keyVal: string }) {
  const api = useAdminApi(keyVal);
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () =>
    api<{ photos: Photo[] }>("/api/admin/photos").then((d) => setPhotos(d.photos)).catch(() => setMsg("couldn't load photos"));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(file: File) {
    setBusy(true);
    setMsg(`uploading ${file.name}…`);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).split(",")[1] ?? "");
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const d = await api<{ caption?: string }>("/api/admin/photos", {
        method: "POST",
        body: JSON.stringify({ name: file.name, dataBase64: b64 }),
      });
      setMsg(d.caption ? `uploaded ✓ captioned: "${d.caption}" (clusters refresh on next npm run media)` : "uploaded ✓");
      refresh();
    } catch {
      setMsg("upload failed (jpg/png/webp, under 8MB)");
    } finally {
      setBusy(false);
    }
  }

  async function remove(src: string) {
    const name = src.split("/").pop()!;
    if (!confirm(`Delete ${name}?`)) return;
    await api("/api/admin/photos", { method: "DELETE", body: JSON.stringify({ name }) });
    refresh();
  }

  if (!photos) return <p className="mt-6 font-body text-sm text-ink-soft">opening the album… ✦</p>;

  return (
    <div className="mt-6">
      <label className={`${btnDark} inline-block cursor-pointer`}>
        {busy ? "working…" : "⇪ upload a photo"}
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          disabled={busy}
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </label>
      {msg && <p className="mt-3 font-body text-sm text-ink-soft">{msg}</p>}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((p) => (
          <figure key={p.src} className="overflow-hidden rounded-2xl soft-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={p.caption} className="aspect-square w-full object-cover" />
            <figcaption className="flex items-center justify-between gap-2 p-2 font-body text-[11px] text-ink-soft">
              <span className="truncate">{p.caption || "…"}</span>
              <button className="shrink-0 font-semibold text-rose-500 hover:underline" onClick={() => remove(p.src)}>
                ✕
              </button>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ---------------- passages (site copy) ---------------- */

interface CopyBlockRow {
  id: string;
  page: string;
  label: string;
  text: string;
  isDefault: boolean;
}

function PassagesTab({ keyVal, initialPage }: { keyVal: string; initialPage: string | null }) {
  const api = useAdminApi(keyVal);
  const [blocks, setBlocks] = useState<CopyBlockRow[] | null>(null);
  const [pageFilter, setPageFilter] = useState<string | null>(initialPage);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ blocks: CopyBlockRow[] }>("/api/admin/copy")
      .then((d) => setBlocks(d.blocks))
      .catch(() => setMsg("couldn't load passages"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!blocks) return;
    setMsg("saving…");
    try {
      const texts = Object.fromEntries(blocks.map((b) => [b.id, b.text]));
      await api("/api/admin/copy", { method: "POST", body: JSON.stringify({ texts }) });
      setMsg("saved ✓ live immediately");
    } catch {
      setMsg("save failed, try again?");
    }
  }

  async function revert() {
    if (!confirm("Revert every passage to the version written in the code?")) return;
    await api("/api/admin/copy", { method: "DELETE" });
    const d = await api<{ blocks: CopyBlockRow[] }>("/api/admin/copy");
    setBlocks(d.blocks);
    setMsg("reverted to repo defaults ✓");
  }

  if (!blocks) return <p className="mt-6 font-body text-sm text-ink-soft">opening the pages… ✦</p>;

  const pages = [...new Set(blocks.map((b) => b.page))];
  const shown = pageFilter ? blocks.filter((b) => b.page === pageFilter) : blocks;

  return (
    <div className="mt-4">
      {msg && <p className="font-body text-sm text-ink-soft">{msg}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button className={btnDark} onClick={save}>save everything</button>
        <button className={btnSoft} onClick={revert}>revert all to defaults</button>
        <span className="ml-auto flex flex-wrap gap-1.5">
          <button className={pageFilter === null ? btnDark : btnSoft} onClick={() => setPageFilter(null)}>
            all pages
          </button>
          {pages.map((p) => (
            <button key={p} className={pageFilter === p ? btnDark : btnSoft} onClick={() => setPageFilter(p)}>
              {p}
            </button>
          ))}
        </span>
      </div>
      <div className="mt-4 space-y-4">
        {shown.map((b) => (
          <div key={b.id} className="rounded-3xl p-4 soft-card">
            <p className="font-body text-sm font-bold text-ink">
              {b.page} · {b.label}
              {!b.isDefault && <span className="ml-2 font-normal text-ink-soft">(edited)</span>}
            </p>
            <textarea
              className={`${field} mt-2 min-h-24`}
              value={b.text}
              onChange={(e) =>
                setBlocks(blocks.map((x) => (x.id === b.id ? { ...x, text: e.target.value, isDefault: false } : x)))
              }
            />
          </div>
        ))}
      </div>
      <div className="mt-4">
        <button className={btnDark} onClick={save}>save everything</button>
      </div>
    </div>
  );
}

/* ---------------- journey (about entries) ---------------- */

function EntryForm({ entry, onChange, onRemove }: { entry: Entry; onChange: (e: Entry) => void; onRemove: () => void }) {
  return (
    <div className="space-y-2 rounded-3xl p-4 soft-card">
      <div className="flex gap-2">
        <input className={`${field} !w-16 text-center`} placeholder="✨" value={entry.icon} onChange={(e) => onChange({ ...entry, icon: e.target.value })} />
        <input className={field} placeholder="when (e.g. 2023 – 2025)" value={entry.when} onChange={(e) => onChange({ ...entry, when: e.target.value })} />
      </div>
      <input className={field} placeholder="title" value={entry.title} onChange={(e) => onChange({ ...entry, title: e.target.value })} />
      <input className={field} placeholder="place" value={entry.place} onChange={(e) => onChange({ ...entry, place: e.target.value })} />
      <textarea className={`${field} min-h-16`} placeholder="one-line note" value={entry.note} onChange={(e) => onChange({ ...entry, note: e.target.value })} />
      <textarea
        className={`${field} min-h-24`}
        placeholder={"details, one per line (use **bold** for emphasis)"}
        value={(entry.details ?? []).join("\n")}
        onChange={(e) => onChange({ ...entry, details: e.target.value.split("\n") })}
      />
      <div className="flex gap-2">
        <input
          className={field}
          placeholder="domains, comma-separated (Healthcare, Legal, …)"
          value={(entry.domains ?? []).join(", ")}
          onChange={(e) => onChange({ ...entry, domains: e.target.value.split(",").map((s) => s.trim()) as Entry["domains"] })}
        />
        <input
          className={field}
          placeholder="tech areas, comma-separated (NLP, Causal Inference, …)"
          value={(entry.tech ?? []).join(", ")}
          onChange={(e) => onChange({ ...entry, tech: e.target.value.split(",").map((s) => s.trim()) as Entry["tech"] })}
        />
      </div>
      <button className={btnDanger} onClick={onRemove}>remove entry</button>
    </div>
  );
}

const BLANK: Entry = { icon: "✨", when: "", title: "", place: "", note: "" };

function JourneyTab({ keyVal }: { keyVal: string }) {
  const api = useAdminApi(keyVal);
  const [education, setEducation] = useState<Entry[] | null>(null);
  const [timeline, setTimeline] = useState<Entry[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ education: Entry[]; timeline: Entry[] }>("/api/admin/about")
      .then((d) => {
        setEducation(d.education);
        setTimeline(d.timeline);
      })
      .catch(() => setMsg("couldn't load entries"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setMsg("saving…");
    try {
      await api("/api/admin/about", { method: "POST", body: JSON.stringify({ education, timeline }) });
      setMsg("saved ✓ live on About immediately (chatbot follows within a few minutes)");
    } catch {
      setMsg("save failed, every entry needs at least a title");
    }
  }

  async function revert() {
    if (!confirm("Revert to the versions written in the code? Your edits here will be lost.")) return;
    await api("/api/admin/about", { method: "DELETE" });
    const d = await api<{ education: Entry[]; timeline: Entry[] }>("/api/admin/about");
    setEducation(d.education);
    setTimeline(d.timeline);
    setMsg("reverted to repo defaults ✓");
  }

  if (!education) return <p className="mt-6 font-body text-sm text-ink-soft">opening the journal… ✦</p>;

  const section = (label: string, list: Entry[], set: (l: Entry[]) => void) => (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-body text-lg font-bold text-ink">{label}</h2>
        <button className={btnSoft} onClick={() => set([BLANK, ...list])}>＋ add</button>
      </div>
      <div className="mt-3 space-y-3">
        {list.map((e, i) => (
          <EntryForm
            key={i}
            entry={e}
            onChange={(ne) => set(list.map((x, j) => (j === i ? ne : x)))}
            onRemove={() => set(list.filter((_, j) => j !== i))}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="mt-4">
      {msg && <p className="font-body text-sm text-ink-soft">{msg}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <button className={btnDark} onClick={save}>save everything</button>
        <button className={btnSoft} onClick={revert}>revert to repo defaults</button>
      </div>
      {section("🎓 education", education, setEducation)}
      {section("💼 work & research", timeline, setTimeline)}
      <div className="mt-6">
        <button className={btnDark} onClick={save}>save everything</button>
      </div>
    </div>
  );
}

/* ---------------- shell ---------------- */

function EditRoom() {
  const sp = useSearchParams();
  const initialTab = (sp.get("tab") ?? "passages") as "passages" | "poems" | "photos" | "journey";
  const initialPage = sp.get("page");
  const [key, setKey] = useState("");
  const [entered, setEntered] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"passages" | "poems" | "photos" | "journey">(initialTab);

  useEffect(() => {
    const saved = localStorage.getItem("admin-key");
    if (saved) {
      setKey(saved);
      setEntered(true);
    }
  }, []);

  async function tryKey(k: string) {
    setErr("");
    const res = await fetch("/api/admin/poems", { headers: { "x-admin-key": k } });
    if (res.status === 401) return setErr("that's not the key 🌙");
    if (res.status === 503) return setErr("ADMIN_KEY isn't configured on this deploy yet.");
    if (!res.ok) return setErr("something wobbled, try again?");
    localStorage.setItem("admin-key", k);
    setEntered(true);
  }

  return (
    <PageShell vibe="lilac">
      <div className="text-center">
        <PageTitle>the atelier 🗝️</PageTitle>
        <p className="mt-3 font-body text-base text-ink-soft">
          where little things get quietly rearranged ✦
        </p>
      </div>

      {!entered ? (
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
              className={field}
            />
            <button type="submit" className={btnDark}>
              open
            </button>
          </form>
          {err && <p className="mt-3 text-center font-body text-sm text-rose-500">{err}</p>}
        </>
      ) : (
        <div className="mx-auto mt-8 max-w-3xl">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["passages", "✍️ passages"],
                ["poems", "🕯️ poems"],
                ["photos", "📷 photos"],
                ["journey", "🎓 journey"],
              ] as const
            ).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} className={tab === t ? btnDark : btnSoft}>
                {label}
              </button>
            ))}
            <button
              className={`${btnSoft} ml-auto`}
              onClick={() => {
                localStorage.removeItem("admin-key");
                setEntered(false);
                setKey("");
              }}
            >
              lock up 🔒
            </button>
          </div>
          {tab === "passages" && <PassagesTab keyVal={key} initialPage={initialPage} />}
          {tab === "poems" && <PoemsTab keyVal={key} />}
          {tab === "photos" && <PhotosTab keyVal={key} />}
          {tab === "journey" && <JourneyTab keyVal={key} />}
        </div>
      )}
    </PageShell>
  );
}

export default function EditPage() {
  return (
    <Suspense fallback={null}>
      <EditRoom />
    </Suspense>
  );
}
