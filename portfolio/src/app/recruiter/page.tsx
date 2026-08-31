import Link from "next/link";
import type { Entry as AboutEntry } from "@/data/about";
import { getAllProjects } from "@/lib/github-projects";
import { getAboutEntries } from "@/lib/aboutData";
import { getCopy } from "@/lib/siteCopy";
import { isResearchEntry } from "@/lib/aboutSections";
import {
  ROLES,
  ROLE_SPECS,
  isRole,
  plain,
  projectsForRole,
  researchForRole,
  type Role,
} from "@/lib/recruiter";

export const metadata = {
  title: "For recruiters",
  // this view is a convenience for one reader, not a second front door to the
  // site: it should not compete with the real pages in search results
  robots: { index: false, follow: true },
};

// projects come from GitHub and entries from Blobs, both of which change
// without a build
export const dynamic = "force-dynamic";

/** Deliberately plain: system fonts, one column, no motion. */
const H2 = "mt-10 border-b border-neutral-300 pb-1 text-sm font-semibold uppercase tracking-widest text-neutral-500";

export default async function Recruiter({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: raw } = await searchParams;
  const role: Role | null = isRole(raw) ? raw : null;

  const [projects, { education, timeline }, copy] = await Promise.all([
    getAllProjects(),
    getAboutEntries(),
    getCopy(),
  ]);

  const t = (k: string) => plain(copy[k], 2000);

  return (
    <div className="min-h-screen bg-white">
      <article className="mx-auto max-w-3xl px-6 py-12 font-sans text-[15px] leading-relaxed text-neutral-900">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Rishika Mamidibathula</h1>
        <p className="mt-1 text-neutral-600">
          New York ·{" "}
          <a className="underline" href="mailto:rm4318@columbia.edu">
            rm4318@columbia.edu
          </a>{" "}
          ·{" "}
          <a className="underline" href="https://github.com/rishika1099">
            GitHub
          </a>{" "}
          ·{" "}
          <Link className="underline" href="/resume">
            Résumé
          </Link>
        </p>
      </header>

      {/* The question. Real links, so a chosen role is a URL she can send. */}
      <section className="mt-8 rounded-lg border border-neutral-300 p-5">
        <h2 className="font-semibold">{t("recruiter.ask")}</h2>
        <p className="mt-1 text-neutral-600">{t("recruiter.intro")}</p>
        <nav className="mt-4 flex flex-wrap gap-2">
          {ROLES.map((r) => {
            const on = r === role;
            return (
              <Link
                key={r}
                href={`/recruiter?role=${r}`}
                aria-current={on ? "page" : undefined}
                className={`rounded border px-3 py-1.5 text-sm font-medium ${
                  on
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-400 text-neutral-800 hover:border-neutral-900"
                }`}
              >
                {ROLE_SPECS[r].label}
              </Link>
            );
          })}
        </nav>
      </section>

      {!role ? (
        <p className="mt-8 text-neutral-600">
          Or read the{" "}
          <Link className="underline" href="/">
            full site
          </Link>
          , which has everything rather than a selection.
        </p>
      ) : (
        <RoleView
          role={role}
          projects={projects}
          education={education}
          timeline={timeline}
          t={t}
        />
      )}
      </article>
    </div>
  );
}

function RoleView({
  role,
  projects,
  education,
  timeline,
  t,
}: {
  role: Role;
  projects: Awaited<ReturnType<typeof getAllProjects>>;
  education: Awaited<ReturnType<typeof getAboutEntries>>["education"];
  timeline: Awaited<ReturnType<typeof getAboutEntries>>["timeline"];
  t: (k: string) => string;
}) {
  const spec = ROLE_SPECS[role];
  const picked = projectsForRole(projects, role);
  const research = researchForRole(timeline.filter(isResearchEntry), role);
  const jobs = timeline.filter((e) => !isResearchEntry(e));

  return (
    <>
      <p className="mt-8 text-[15px]">{t(`recruiter.summary.${role}`)}</p>

      <h2 className={H2}>{t("recruiter.heading.skills")}</h2>
      <ul className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2">
        {spec.skills.map((s) => (
          <li key={s} className="list-inside list-disc">
            {s}
          </li>
        ))}
      </ul>

      <h2 className={H2}>
        {t("recruiter.heading.projects")}{" "}
        <span className="font-normal normal-case tracking-normal text-neutral-400">
          ({picked.length} of {projects.length}, chosen for this role)
        </span>
      </h2>
      <ol className="mt-3 space-y-4">
        {picked.map((p) => (
          <li key={p.name}>
            <div className="font-semibold">{p.name}</div>
            <p className="text-neutral-700">{plain(p.blurb, 400)}</p>
            <p className="mt-0.5 text-sm text-neutral-500">
              {p.categories.join(" · ")}
              {p.repo && (
                <>
                  {" — "}
                  <a className="underline" href={p.repo}>
                    code
                  </a>
                </>
              )}
              {p.demo && (
                <>
                  {" · "}
                  <a className="underline" href={p.demo}>
                    demo
                  </a>
                </>
              )}
              {p.article && (
                <>
                  {" · "}
                  <a className="underline" href={p.article}>
                    write-up
                  </a>
                </>
              )}
            </p>
          </li>
        ))}
      </ol>

      {research.length > 0 && (
        <>
          <h2 className={H2}>{t("recruiter.heading.research")}</h2>
          <ol className="mt-3 space-y-4">
            {research.map((e) => (
              <Entry key={plain(e.title)} e={e} />
            ))}
          </ol>
        </>
      )}

      <h2 className={H2}>{t("recruiter.heading.experience")}</h2>
      <ol className="mt-3 space-y-4">
        {jobs.map((e) => (
          <Entry key={plain(e.title)} e={e} />
        ))}
      </ol>

      <h2 className={H2}>{t("recruiter.heading.education")}</h2>
      <ol className="mt-3 space-y-4">
        {education.map((e) => (
          <Entry key={plain(e.title)} e={e} />
        ))}
      </ol>

      <p className="mt-12 border-t border-neutral-200 pt-4 text-sm text-neutral-500">
        This is a filtered view for {spec.article}.{" "}
        <Link className="underline" href="/">
          The full site
        </Link>{" "}
        has everything, with rather more colour.
      </p>
    </>
  );
}

function Entry({ e }: { e: AboutEntry }) {
  return (
    <li>
      <div className="font-semibold">
        {plain(e.title)}
        {e.subtitle && <span className="font-normal">, {plain(e.subtitle)}</span>}
      </div>
      <div className="text-sm text-neutral-500">
        {plain(e.place)}
        {e.when && ` · ${plain(e.when)}`}
      </div>
      <p className="mt-0.5 text-neutral-700">{plain(e.note, 500)}</p>
    </li>
  );
}
