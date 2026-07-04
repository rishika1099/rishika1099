"use client";

// In-place editor for the Work page. The intro is editable, and every project
// (curated or auto-pulled) can be tuned: feature it, rename it, rewrite the
// blurb, or adjust its tags. Anything left empty falls back to the automatic
// pipeline value, the pipeline stays the default, edits are the exception.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import WorkGallery from "@/components/WorkGallery";
import ProjectGalaxy from "@/components/ProjectGalaxy";
import { AdminGate, adminApi } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";
import type { Category, Domain, Project } from "@/data/projects";

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

function ProjectManager({ keyVal }: { keyVal: string }) {
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

  const commaField = (
    label: string,
    value: string[],
    set: (v: string[]) => void,
    hint: string,
  ) => (
    <div>
      <p className="font-body text-[11px] font-semibold text-ink-soft">{label}</p>
      <input
        className={field}
        value={value.join(", ")}
        placeholder={hint}
        onChange={(e) => set(e.target.value.split(",").map((s) => s.trim()))}
      />
    </div>
  );

  return (
    <details className="mt-8 rounded-3xl p-5 soft-card sm:p-6" open>
      <summary className="cursor-pointer font-body text-lg font-bold text-ink">
        🌿 manage projects <span className="font-normal text-ink-soft">(⭐ = featured bloom · empty field = automatic)</span>
      </summary>
      {msg && <p className="mt-2 font-body text-sm text-ink-soft">{msg}</p>}
      <input
        className={`${field} mt-3 max-w-sm`}
        placeholder="find a project…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="mt-3 max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
        {projects === null && (
          <p className="font-body text-sm text-ink-soft">gathering the seedlings… ✦</p>
        )}
        {shown.map((p) => (
          <li
            key={p.slug}
            className={`rounded-2xl p-2.5 transition ${
              open === p.slug
                ? "bg-blush/25 ring-2 ring-blush shadow-md"
                : "bg-white/50"
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
                  edited: {p.overridden.join(", ")}
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
                  <textarea
                    className={`${field} min-h-20`}
                    value={form.blurb}
                    onChange={(e) => setForm({ ...form, blurb: e.target.value })}
                  />
                </div>
                {commaField("tech areas", form.categories, (v) => setForm({ ...form, categories: v }), "Generative AI, NLP, …")}
                {commaField("domains", form.domains, (v) => setForm({ ...form, domains: v }), "Healthcare, Legal, …")}
                {commaField("little tags", form.tags, (v) => setForm({ ...form, tags: v }), "RAG, Python, …")}
                <p className="font-body text-[11px] text-ink-soft/70">
                  clear a field and save to hand it back to the automatic pipeline ✦
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
    </details>
  );
}

function Editor({
  keyVal,
  projects,
  categories,
  domains,
}: {
  keyVal: string;
  projects: Project[];
  categories: Category[];
  domains: Domain[];
}) {
  const { ready, box, bar } = usePassageEditor(keyVal, ["work.intro"], "/work");
  if (!ready)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;
  return (
    <PageShell vibe="meadow">
      {bar}
      <PageTitle>my little meadow of projects 🌱</PageTitle>
      <p className="mt-1 font-body text-[11px] text-ink-soft/60">
        {"{count}"} becomes the live project count ({projects.length} right now):
      </p>
      <div className="max-w-4xl">{box("work.intro", "font-body text-lg text-ink-soft")}</div>

      <ProjectManager keyVal={keyVal} />

      <WorkGallery projects={projects} categories={categories} domains={domains} />
      <ProjectGalaxy />
    </PageShell>
  );
}

export default function WorkEditClient(props: {
  projects: Project[];
  categories: Category[];
  domains: Domain[];
}) {
  return <AdminGate vibe="meadow">{(key) => <Editor keyVal={key} {...props} />}</AdminGate>;
}
