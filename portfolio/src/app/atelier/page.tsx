"use client";

// The atelier: every editable thing in one room (passages, poems, photos,
// projects, blog posts), color-coded to match each page's background. Writes go
// through key-gated admin APIs into Netlify Blobs (or local files in dev).

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import InkEditor from "@/components/InkEditor";
import ProjectManager from "@/components/ProjectManager";
import { RichPostManager, AutoPostManager } from "@/components/BlogManagers";
import AboutEntriesManager from "@/components/AboutEntriesManager";
import ContactManager from "@/components/ContactManager";
import { setEditMode } from "@/lib/editMode";

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

// each page's dominant background pastel, used to tint pills + passage cards
const PAGE_TINT: Record<string, string> = {
  home: "#ffd9c0", // dawn
  about: "#e6d7f5", // lilac
  work: "#cdeac0", // meadow
  blog: "#ffe2ce", // peach
  photography: "#ffc6a8", // sunset
  now: "#ffd9c0", // dawn
  tour: "#c5e8d5", // aurora
  contact: "#f7b7c9", // rose
};
const tintOf = (page: string) => PAGE_TINT[page] ?? "#f6d99b";

// the atelier is organised by what you're editing, not by page. Each cluster is
// [id, label, tint]; content is wired up in the shell below.
const CLUSTERS = [
  ["titles", "🔤 titles", "#f6d99b"],
  ["passages", "✍️ passages", "#f6d99b"],
  ["buttons", "🔘 buttons", "#ffd9c0"],
  ["projects", "🌱 projects", "#cdeac0"],
  ["blogs", "📓 blogs", "#bfe0f0"],
  ["poems", "🕯️ poems", "#d9c2f0"],
  ["photos", "📷 photos", "#ffc0a0"],
  ["work", "💼 work", "#cdeac0"],
  ["education", "🎓 education", "#e6d7f5"],
  ["research", "🔬 research", "#c5e8d5"],
  ["contact", "💌 contact", "#f7b7c9"],
] as const;
type ClusterId = (typeof CLUSTERS)[number][0];
const CLUSTER_IDS = CLUSTERS.map((c) => c[0]) as ClusterId[];

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

  async function saveCaption(src: string, caption: string) {
    const name = src.split("/").pop()!;
    setMsg("saving caption…");
    try {
      await api("/api/admin/photos", { method: "POST", body: JSON.stringify({ name, caption }) });
      setMsg("caption saved ✓");
    } catch {
      setMsg("caption save failed");
    }
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
            <figcaption className="flex items-center gap-1.5 p-2">
              <input
                defaultValue={p.caption}
                placeholder="caption…"
                onBlur={(e) => e.target.value !== p.caption && saveCaption(p.src, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className="w-full rounded-lg border border-dashed border-ink/15 bg-white/50 px-1.5 py-0.5 font-body text-[11px] text-ink-soft outline-none focus:border-blush"
              />
              <button className="shrink-0 font-body text-xs font-semibold text-rose-500 hover:underline" onClick={() => remove(p.src)}>
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

// which cluster a copy block belongs to, by its id
type CopyKind = "title" | "button" | "tour" | "passage";
function copyKind(id: string): CopyKind {
  if (id.startsWith("tour.")) return "tour";
  if (id.startsWith("home.tab.") || id.startsWith("blog.door.")) return "button";
  if (
    id.endsWith(".title") ||
    id === "home.name1" ||
    id === "home.name2" ||
    id.includes(".heading.") ||
    id.includes(".head.")
  )
    return "title";
  return "passage";
}

function CopyTab({
  keyVal,
  kind,
  scopeLabel,
}: {
  keyVal: string;
  kind: CopyKind;
  scopeLabel: string;
}) {
  const api = useAdminApi(keyVal);
  const [blocks, setBlocks] = useState<CopyBlockRow[] | null>(null);
  const [pinned, setPinned] = useState(false);
  const [msg, setMsg] = useState("");

  const reload = async () => {
    const d = await api<{ blocks: CopyBlockRow[]; hasBaseline: boolean }>("/api/admin/copy");
    setBlocks(d.blocks);
    setPinned(d.hasBaseline);
  };

  useEffect(() => {
    api<{ blocks: CopyBlockRow[]; hasBaseline: boolean }>("/api/admin/copy")
      .then((d) => {
        setBlocks(d.blocks);
        setPinned(d.hasBaseline);
      })
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

  // pin this cluster's current words as the new default, so "revert" returns here
  async function makeDefault() {
    if (!blocks) return;
    if (!confirm(`Make the current ${scopeLabel} the default? "Revert" will come back here.`)) return;
    setMsg("pinning…");
    // save the latest edits first so what you see is what gets pinned
    const texts = Object.fromEntries(blocks.map((b) => [b.id, b.text]));
    await api("/api/admin/copy", { method: "POST", body: JSON.stringify({ texts }) });
    const ids = blocks.filter((b) => copyKind(b.id) === kind).map((b) => b.id);
    await api("/api/admin/copy", { method: "POST", body: JSON.stringify({ promote: true, ids }) });
    await reload();
    setMsg("pinned as the default ✓");
  }

  // revert just this cluster to the default (pinned baseline, else code)
  async function revert() {
    if (!blocks) return;
    const target = pinned ? "your pinned default" : "the version written in the code";
    if (!confirm(`Revert the ${scopeLabel} to ${target}?`)) return;
    const ids = blocks.filter((b) => copyKind(b.id) === kind).map((b) => b.id);
    await api(`/api/admin/copy?ids=${encodeURIComponent(ids.join(","))}`, { method: "DELETE" });
    await reload();
    setMsg("reverted ✓");
  }

  async function resetToCode() {
    if (!confirm("Unpin your default too and go all the way back to the original code?")) return;
    await api("/api/admin/copy?hard=1", { method: "DELETE" });
    await reload();
    setMsg("reset to the original code ✓");
  }

  if (!blocks) return <p className="mt-6 font-body text-sm text-ink-soft">opening the pages… ✦</p>;

  const shown = blocks.filter((b) => copyKind(b.id) === kind);

  return (
    <div className="mt-4">
      {msg && <p className="font-body text-sm text-ink-soft">{msg}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <button className={btnDark} onClick={save}>save everything</button>
        <button className={btnSoft} onClick={makeDefault}>
          📌 make these the default
        </button>
        <button className={btnSoft} onClick={revert}>
          revert these
        </button>
        {pinned && (
          <button className={btnSoft} onClick={resetToCode}>
            reset all to original code
          </button>
        )}
      </div>
      {shown.length === 0 && (
        <p className="mt-4 font-body text-sm text-ink-soft">nothing here yet ✦</p>
      )}
      <div className="mt-4 space-y-4">
        {shown.map((b) => (
          <div key={b.id} className="rounded-3xl p-4 soft-card transition focus-within:ring-2 focus-within:ring-blush focus-within:shadow-lg" style={{ backgroundColor: `${tintOf(b.page)}59` }}>
            <p className="flex items-center gap-1.5 font-body text-sm font-bold text-ink">
              <span aria-hidden className="h-3 w-3 rounded-full ring-1 ring-white/80" style={{ backgroundColor: tintOf(b.page) }} />
              {b.page} · {b.label}
              {!b.isDefault && <span className="ml-2 font-normal text-ink-soft">(edited)</span>}
            </p>
            <div className="mt-2">
              <InkEditor
                initialHtml={b.text}
                onChange={(v) =>
                  setBlocks((bs) =>
                    (bs ?? []).map((x) => (x.id === b.id ? { ...x, text: v, isDefault: false } : x)),
                  )
                }
                compact
                placeholder="write here…"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <button className={btnDark} onClick={save}>save everything</button>
      </div>
    </div>
  );
}

/* ---------------- shell ---------------- */

function EditRoom() {
  const sp = useSearchParams();
  const tabParam = sp.get("tab");
  const initialTab = (tabParam && CLUSTER_IDS.includes(tabParam as ClusterId)
    ? tabParam
    : "titles") as ClusterId;
  const [key, setKey] = useState("");
  const [entered, setEntered] = useState(false);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<ClusterId>(initialTab);

  useEffect(() => {
    const saved = localStorage.getItem("admin-key");
    if (saved) {
      setKey(saved);
      setEntered(true);
      setEditMode(true);
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
    setEditMode(true);
  }

  return (
    <PageShell vibe="rainbow">
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
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {/* one tab per kind of thing you can edit */}
              {CLUSTERS.map(([id, label, tint]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{ backgroundColor: tab === id ? tint : `${tint}66` }}
                  className={`${btn} text-ink ${tab === id ? "ring-2 ring-ink/25" : "hover:ring-1 hover:ring-ink/15"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              className={`${btnSoft} shrink-0`}
              onClick={() => {
                localStorage.removeItem("admin-key");
                setEntered(false);
                setKey("");
                setEditMode(false);
              }}
            >
              lock up 🔒
            </button>
          </div>

          {tab === "titles" && <CopyTab keyVal={key} kind="title" scopeLabel="titles & headings" />}
          {tab === "passages" && <CopyTab keyVal={key} kind="passage" scopeLabel="passages" />}
          {tab === "buttons" && <CopyTab keyVal={key} kind="button" scopeLabel="button labels" />}
          {tab === "projects" && (
            <div className="mt-6 rounded-3xl p-5 soft-card sm:p-6">
              <ProjectManager keyVal={key} />
            </div>
          )}
          {tab === "blogs" && (
            <>
              <div className="mt-6 rounded-3xl p-5 soft-card sm:p-6">
                <RichPostManager keyVal={key} />
                <AutoPostManager keyVal={key} />
              </div>
              <p className="mt-8 font-body text-sm font-bold text-ink">✦ the feature-tour article</p>
              <CopyTab keyVal={key} kind="tour" scopeLabel="tour article" />
            </>
          )}
          {tab === "poems" && <PoemsTab keyVal={key} />}
          {tab === "photos" && <PhotosTab keyVal={key} />}
          {tab === "work" && <AboutEntriesManager keyVal={key} section="work" />}
          {tab === "education" && <AboutEntriesManager keyVal={key} section="education" />}
          {tab === "research" && <AboutEntriesManager keyVal={key} section="research" />}
          {tab === "contact" && <ContactManager keyVal={key} />}
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
