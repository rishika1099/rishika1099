"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/components/editing";
import InkEditor from "@/components/InkEditor";
import type { CaseMetric, CaseStudy } from "@/lib/caseStudies";

/**
 * Writes the deep dive on a project: the tagline, the headline numbers, and the
 * body. A project with one written grows a "read the case study" button on the
 * recruiter page, which opens it in place.
 *
 * The list is the projects, not the case studies, because the question being
 * answered is "which of my projects has one" rather than "what have I written".
 */

const btn =
  "rounded-full px-3.5 py-1 font-body text-xs font-semibold transition disabled:opacity-50";
const btnDark = `${btn} bg-ink text-cream hover:opacity-90`;
const btnSoft = `${btn} bg-white/70 text-ink-soft hover:bg-white`;
const field =
  "w-full rounded-2xl border border-white/70 bg-white/80 px-3 py-1.5 font-body text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-2 focus:ring-blush/30";

interface Row {
  slug: string;
  name: string;
}

const BLANK: CaseStudy = { slug: "", tagline: "", metrics: [], body: "" };

export default function CaseStudyManager({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const router = useRouter();
  const [projects, setProjects] = useState<Row[] | null>(null);
  const [written, setWritten] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<string | null>(null);
  const [form, setForm] = useState<CaseStudy | null>(null);
  const [msg, setMsg] = useState("");

  async function refresh() {
    const [p, c] = await Promise.all([
      api<{ projects: Row[] }>("/api/admin/projects"),
      api<{ caseStudies: CaseStudy[] }>("/api/admin/case-studies"),
    ]);
    setProjects(p.projects.map((x) => ({ slug: x.slug, name: x.name })));
    setWritten(Object.fromEntries((c.caseStudies ?? []).map((x) => [x.slug, true])));
  }

  useEffect(() => {
    refresh().catch(() => setMsg("could not load"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function edit(slug: string) {
    setOpen(slug);
    setMsg("");
    try {
      const d = await api<{ caseStudy: CaseStudy | null }>(`/api/admin/case-studies?slug=${slug}`);
      setForm(d.caseStudy ?? { ...BLANK, slug });
    } catch {
      setForm({ ...BLANK, slug });
    }
  }

  async function save() {
    if (!form) return;
    setMsg("saving…");
    try {
      await api("/api/admin/case-studies", { method: "POST", body: JSON.stringify(form) });
      setMsg("saved ✓ live now");
      setOpen(null);
      setForm(null);
      await refresh();
      router.refresh();
    } catch {
      setMsg("save failed");
    }
  }

  async function remove(slug: string) {
    setMsg("removing…");
    try {
      await api("/api/admin/case-studies", { method: "DELETE", body: JSON.stringify({ slug }) });
      setOpen(null);
      setForm(null);
      setMsg("removed");
      await refresh();
      router.refresh();
    } catch {
      setMsg("could not remove");
    }
  }

  const setMetric = (i: number, patch: Partial<CaseMetric>) =>
    setForm((f) =>
      f ? { ...f, metrics: f.metrics.map((m, j) => (j === i ? { ...m, ...patch } : m)) } : f,
    );

  if (projects === null) return <p className="font-body text-sm text-ink-soft">loading…</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-body text-lg font-bold text-ink">📓 case studies</h3>
        {msg && <span className="font-body text-xs text-ink-soft">{msg}</span>}
      </div>
      <p className="mt-1 font-body text-xs text-ink-soft/70">
        the deep dive behind a project: problem, architecture, what it measured. A project with one
        written grows a &quot;read the case study&quot; button on the recruiter page.
      </p>

      <div className="mt-4 space-y-2">
        {projects.map((p) => (
          <div key={p.slug}>
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/50 px-3 py-2">
              <span className="font-body text-sm font-semibold text-ink">{p.name}</span>
              {written[p.slug] && (
                <span className="rounded-full bg-mint/70 px-2 py-0.5 font-body text-[10px] font-semibold text-ink">
                  written
                </span>
              )}
              <span className="ml-auto flex gap-2">
                <button
                  className={btnSoft}
                  onClick={() => (open === p.slug ? setOpen(null) : edit(p.slug))}
                >
                  {open === p.slug ? "close" : written[p.slug] ? "edit" : "write one"}
                </button>
                {written[p.slug] && (
                  <button className={btnSoft} onClick={() => remove(p.slug)}>
                    remove
                  </button>
                )}
              </span>
            </div>

            {open === p.slug && form && (
              <div className="mt-2 space-y-3 rounded-2xl bg-white/40 p-4">
                <div>
                  <p className="font-body text-[11px] font-semibold text-ink-soft">
                    tagline: one line under the title
                  </p>
                  <input
                    className={field}
                    value={form.tagline}
                    placeholder="what it is, in a sentence"
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  />
                </div>

                <div>
                  <p className="font-body text-[11px] font-semibold text-ink-soft">
                    headline numbers (up to 8)
                  </p>
                  <div className="mt-1 space-y-2">
                    {form.metrics.map((m, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          className={`${field} max-w-[8rem]`}
                          value={m.value}
                          placeholder="85.1%"
                          onChange={(e) => setMetric(i, { value: e.target.value })}
                        />
                        <input
                          className={field}
                          value={m.label}
                          placeholder="micro-F1"
                          onChange={(e) => setMetric(i, { label: e.target.value })}
                        />
                        <button
                          className={btnSoft}
                          onClick={() =>
                            setForm({ ...form, metrics: form.metrics.filter((_, j) => j !== i) })
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {form.metrics.length < 8 && (
                      <button
                        className={btnSoft}
                        onClick={() =>
                          setForm({ ...form, metrics: [...form.metrics, { label: "", value: "" }] })
                        }
                      >
                        + a number
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-body text-[11px] font-semibold text-ink-soft">
                    the body: problem, architecture, evaluation
                  </p>
                  <InkEditor
                    initialHtml={form.body}
                    onChange={(v) => setForm({ ...form, body: v })}
                    placeholder="what the problem was, how it is built, what it measured…"
                  />
                  <p className="mt-1 font-body text-[10px] text-ink-soft/70">
                    the architecture diagram is drawn automatically from the repo, so it does not
                    need describing here.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button className={btnDark} onClick={save}>
                    save
                  </button>
                  <button className={btnSoft} onClick={() => setOpen(null)}>
                    cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
