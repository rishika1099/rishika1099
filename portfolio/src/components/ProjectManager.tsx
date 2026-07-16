"use client";

// Manage every project (curated or auto-pulled): feature it, rename it,
// rewrite the blurb in the ink editor, or adjust its tags. Empty = automatic.
// Used both on /work/edit and inside the atelier.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/components/editing";
import TagPicker from "@/components/TagPicker";
import InkEditor from "@/components/InkEditor";
import {
  categories as ALL_CATEGORIES,
  domains as ALL_DOMAINS,
  domainColor,
  type Domain,
} from "@/data/projects";

interface AdminProject {
  slug: string;
  name: string;
  blurb: string;
  featured: boolean;
  categories: string[];
  domains: string[];
  tags: string[];
  repo: string;
  overridden: string[];
}

const btn =
  "rounded-full px-3.5 py-1 font-body text-xs font-semibold transition disabled:opacity-50";
const btnDark = `${btn} bg-ink text-cream hover:opacity-90`;
const btnSoft = `${btn} bg-white/70 text-ink-soft hover:bg-white`;
const field =
  "w-full rounded-2xl border border-white/70 bg-white/80 px-3 py-1.5 font-body text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-2 focus:ring-blush/30";

export default function ProjectManager({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const router = useRouter();
  const [projects, setProjects] = useState<AdminProject[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState<AdminProject | null>(null);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState("");

  const refresh = () =>
    api<{ projects: AdminProject[] }>("/api/admin/projects")
      .then((d) => setProjects(d.projects))
      .catch(() => setMsg("couldn't load projects"));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleFeatured(p: AdminProject) {
    await api("/api/admin/projects", {
      method: "POST",
      body: JSON.stringify({ slug: p.slug, featured: !p.featured }),
    });
    refresh();
    router.refresh();
  }

  async function saveForm() {
    if (!form) return;
    setMsg("saving…");
    try {
      await api("/api/admin/projects", {
        method: "POST",
        body: JSON.stringify({
          slug: form.slug,
          name: form.name,
          blurb: form.blurb,
          categories: form.categories,
          domains: form.domains,
          tags: form.tags,
        }),
      });
      setOpen(null);
      setForm(null);
      setMsg("saved ✓");
      refresh();
      router.refresh();
    } catch {
      setMsg("save failed, try again?");
    }
  }

  async function resetAuto(slug: string) {
    if (!confirm("Reset this project to the fully automatic values?")) return;
    await api("/api/admin/projects", { method: "DELETE", body: JSON.stringify({ slug }) });
    setOpen(null);
    setForm(null);
    refresh();
    router.refresh();
  }

  const shown = (projects ?? []).filter(
    (p) => !q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-body text-lg font-bold text-ink">
          🌿 projects{" "}
          <span className="font-normal text-ink-soft">(⭐ = featured · empty = automatic)</span>
        </h2>
        <input
          className={`${field} max-w-[14rem]`}
          placeholder="find a project…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {msg && <p className="mt-2 font-body text-sm text-ink-soft">{msg}</p>}
      <ul className="mt-3 max-h-[32rem] space-y-1.5 overflow-y-auto pr-1">
        {projects === null && (
          <p className="font-body text-sm text-ink-soft">gathering the seedlings… ✦</p>
        )}
        {shown.map((p) => (
          <li
            key={p.slug}
            className={`rounded-2xl p-2.5 transition ${
              open === p.slug ? "bg-blush/25 ring-2 ring-blush shadow-md" : "bg-white/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleFeatured(p)}
                title={p.featured ? "remove from featured blooms" : "make it a featured bloom"}
                className={`text-lg transition hover:scale-125 ${p.featured ? "" : "opacity-25 grayscale"}`}
              >
                ⭐
              </button>
              <span className="flex-1 truncate font-body text-sm font-semibold text-ink">
                {p.name}
              </span>
              {p.overridden.length > 0 && (
                <span className="rounded-full bg-gold/50 px-2 py-0.5 font-body text-[10px] font-semibold text-ink">
                  edited
                </span>
              )}
              <button
                className={btnSoft}
                onClick={() => {
                  if (open === p.slug) {
                    setOpen(null);
                    setForm(null);
                  } else {
                    setOpen(p.slug);
                    setForm({ ...p });
                  }
                }}
              >
                {open === p.slug ? "close" : "✎ edit"}
              </button>
            </div>
            {open === p.slug && form && (
              <div className="mt-3 space-y-2 border-t border-ink/10 pt-3">
                <div>
                  <p className="font-body text-[11px] font-semibold text-ink-soft">name</p>
                  <input
                    className={field}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <p className="font-body text-[11px] font-semibold text-ink-soft">blurb</p>
                  <div className="mt-1">
                    <InkEditor
                      initialHtml={form.blurb}
                      onChange={(v) => setForm((f) => (f ? { ...f, blurb: v } : f))}
                      compact
                      surfaceClassName="font-body text-sm text-ink-soft"
                      placeholder="what this project does…"
                    />
                  </div>
                </div>
                <div>
                  <p className="font-body text-[11px] font-semibold text-ink-soft">
                    tech areas, tap what applies
                  </p>
                  <div className="mt-1">
                    <TagPicker
                      options={ALL_CATEGORIES}
                      value={form.categories}
                      onChange={(v) => setForm({ ...form, categories: v })}
                      allowCustom
                    />
                  </div>
                </div>
                <div>
                  <p className="font-body text-[11px] font-semibold text-ink-soft">
                    domains, tap what applies
                  </p>
                  <div className="mt-1">
                    <TagPicker
                      options={ALL_DOMAINS}
                      value={form.domains}
                      onChange={(v) => setForm({ ...form, domains: v })}
                      colorFor={(t) => domainColor[t as Domain]}
                      allowCustom
                    />
                  </div>
                </div>
                <div>
                  <p className="font-body text-[11px] font-semibold text-ink-soft">little tags</p>
                  <input
                    className={field}
                    value={form.tags.join(", ")}
                    placeholder="RAG, Python, …"
                    onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((s) => s.trim()) })}
                  />
                </div>
                <p className="font-body text-[11px] text-ink-soft/70">
                  deselect everything (or clear a text field) and save to hand it back to the automatic pipeline ✦
                </p>
                <div className="flex flex-wrap gap-2">
                  <button className={btnDark} onClick={saveForm}>
                    save project
                  </button>
                  <button className={btnSoft} onClick={() => resetAuto(p.slug)}>
                    reset to auto
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
