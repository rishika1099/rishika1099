"use client";

import { useState } from "react";
import ProjectCard from "@/components/ProjectCard";
import type { Project } from "@/data/projects";
import type { Tailored } from "@/lib/tailor";

/**
 * Paste the posting, get her half of the conversation.
 *
 * The four role buttons are a guess at what someone wants. This is the thing
 * itself: the posting ranks the projects by embedding similarity and selects
 * the parts of the resume that answer it, so a recruiter reads the version of
 * her that is relevant to the job they are actually filling.
 *
 * It reports gaps as well as fits. A page that claims a perfect match for every
 * posting is not telling anyone anything, and a recruiter can tell.
 */
export default function JobMatch({ label, hint }: { label: string; hint: string }) {
  const [jd, setJd] = useState("");
  const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");
  const [out, setOut] = useState<Tailored | null>(null);

  async function run() {
    if (jd.trim().length < 40) return;
    setState("working");
    try {
      const res = await fetch("/api/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd }),
      });
      if (!res.ok) throw new Error();
      const d = (await res.json()) as { tailored?: Tailored };
      setOut(d.tailored ?? null);
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="mt-12">
      <h2 className="font-body text-2xl font-bold text-ink">{label}</h2>
      <p className="mt-1 font-body text-sm text-ink-soft">{hint}</p>

      <div className="mt-4 rounded-3xl p-4 soft-card sm:p-5">
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={5}
          placeholder="Paste the job description here: what the company does, and what the role needs."
          className="w-full resize-y rounded-2xl border border-white/70 bg-white/80 px-4 py-3 font-body text-sm leading-relaxed text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-2 focus:ring-blush/30"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={run}
            disabled={jd.trim().length < 40 || state === "working"}
            style={{ backgroundColor: "#c2c0ef" }}
            className="rounded-full px-5 py-2 font-body text-sm font-semibold text-ink ring-1 ring-white/70 transition hover:brightness-[0.97] disabled:opacity-50"
          >
            {state === "working" ? "reading it ✦" : "show me the fit"}
          </button>
          {out && (
            <button
              type="button"
              onClick={() => {
                setOut(null);
                setJd("");
                setState("idle");
              }}
              className="font-body text-xs font-semibold text-ink-soft/80 transition hover:text-ink"
            >
              clear
            </button>
          )}
          {jd.trim().length > 0 && jd.trim().length < 40 && (
            <span className="font-body text-xs text-ink-soft/70">
              a little more of it and I can be useful
            </span>
          )}
          {state === "error" && (
            <span className="font-body text-xs text-ink-soft">
              that did not work. try again?
            </span>
          )}
        </div>
      </div>

      {state === "done" && out && (
        <div className="mt-6">
          {out.summary && (
            <p className="max-w-2xl font-body text-lg leading-relaxed text-ink">{out.summary}</p>
          )}

          {out.skills.length > 0 && (
            <>
              <h3 className="mt-8 font-body text-base font-bold text-ink">
                what you asked for, and she has
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {out.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-white/70 px-3.5 py-1.5 font-body text-sm font-semibold text-ink-soft"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}

          {out.gaps.length > 0 && (
            <>
              <h3 className="mt-6 font-body text-base font-bold text-ink">
                and what she does not
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {out.gaps.map((g) => (
                  <span
                    key={g}
                    className="rounded-full bg-white/40 px-3.5 py-1.5 font-body text-sm text-ink-soft/80"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </>
          )}

          {out.entries.length > 0 && (
            <>
              <h3 className="mt-8 font-body text-base font-bold text-ink">
                the experience that answers it
              </h3>
              <ol className="mt-3 space-y-4">
                {out.entries.map((e, i) => (
                  <li key={`${e.title}-${i}`} className="rounded-3xl p-5 soft-card">
                    <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-ink-soft/70">
                      {e.section}
                    </p>
                    <h4 className="mt-0.5 font-body text-lg font-bold text-ink">{e.title}</h4>
                    {e.meta && (
                      <p className="font-body text-sm text-ink-soft">{e.meta}</p>
                    )}
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 font-body text-[15px] leading-relaxed text-ink-soft">
                      {e.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </>
          )}

          {out.projects.length > 0 && (
            <>
              <h3 className="mt-8 font-body text-base font-bold text-ink">
                the projects closest to it
              </h3>
              <div className="mt-3 grid gap-5 lg:grid-cols-2">
                {out.projects.map((p) => (
                  <ProjectCard key={p.name} p={p as unknown as Project} blurb={p.blurb} />
                ))}
              </div>
            </>
          )}

          <p className="mt-6 font-body text-xs text-ink-soft/70">
            selected from her real resume and projects, never written from the posting ✦
          </p>
        </div>
      )}
    </section>
  );
}
