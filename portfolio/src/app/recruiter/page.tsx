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
  // a convenience for one reader, not a second front door to the site: it
  // should not compete with the real pages in search results
  robots: { index: false, follow: true },
};

// projects come from GitHub and entries from Blobs, both of which change
// without a build
export const dynamic = "force-dynamic";

/**
 * The quiet cousin of the main site: same material, none of the wandering.
 *
 * Not a resume, and not the pastel site with the colour turned down. It should
 * read like a portfolio built for one question, so it gets the things that make
 * a page feel considered rather than printed: a lot of air, type that is
 * confident about being large, and small tracked-out labels doing the work that
 * headings and horizontal rules would do on a CV.
 *
 * The palette and the fonts are the site's own, matching the resume page, so
 * this reads as her quiet register rather than a different site.
 */
// The same label the resume page uses for its section headings, so the two
// plain readings of her work look like they came from the same hand.
const LABEL =
  "font-body text-xs font-bold uppercase tracking-[0.18em] text-ink-soft";

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
    <div className="min-h-screen bg-cream text-ink">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:px-8 sm:py-28">
        <p className={LABEL}>{t("recruiter.title")}</p>

        <h1 className="mt-6 font-body text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Hi, I&rsquo;m
          <br />
          <span className="text-twilight">Rishika</span>
        </h1>

        <p className="mt-7 max-w-xl font-body text-lg leading-relaxed text-ink-soft sm:text-xl">
          {role ? t(`recruiter.summary.${role}`) : t("recruiter.intro")}
        </p>

        {/* The question, and the answer is a URL she can send. */}
        <section className="mt-12">
          <p className={LABEL}>{t("recruiter.ask")}</p>
          <nav className="mt-4 flex flex-wrap gap-2.5">
            {ROLES.map((r) => {
              const on = r === role;
              return (
                <Link
                  key={r}
                  href={`/recruiter?role=${r}`}
                  aria-current={on ? "page" : undefined}
                  className={`rounded-full px-5 py-2.5 font-body text-[15px] font-semibold transition ${
                    on
                      ? "bg-ink text-cream"
                      : "bg-white/70 text-ink-soft hover:bg-white hover:text-ink"
                  }`}
                >
                  {ROLE_SPECS[r].label}
                </Link>
              );
            })}
          </nav>
        </section>

        {role ? (
          <RoleView
            role={role}
            projects={projects}
            education={education}
            timeline={timeline}
            t={t}
          />
        ) : (
          <p className="mt-16 font-body text-[15px] text-ink-soft">
            Or read{" "}
            <Link className="underline decoration-blush decoration-2 underline-offset-4" href="/">
              the whole site
            </Link>
            , which has everything and rather more colour.
          </p>
        )}

        <footer
          className="mt-24 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/20 pt-8 font-body text-[15px] text-ink-soft"
        >
          <a className="underline underline-offset-4" href="mailto:rm4318@columbia.edu">
            rm4318@columbia.edu
          </a>
          <a className="underline underline-offset-4" href="https://github.com/rishika1099">
            GitHub ↗
          </a>
          <Link className="underline underline-offset-4" href="/resume">
            Résumé
          </Link>
          <Link className="underline underline-offset-4" href="/">
            Full site
          </Link>
        </footer>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-20">
      <h2 className={`${LABEL} border-b border-ink/20 pb-3`}>{label}</h2>
      {children}
    </section>
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
      <Section label={t("recruiter.heading.projects")}>
        <ol className="mt-10 space-y-14">
          {picked.map((p) => (
            <li key={p.name}>
              <p className={`${LABEL} text-ink/60`}>{p.categories.join(" · ")}</p>
              <h3 className="mt-3 font-body text-2xl font-bold tracking-tight">{p.name}</h3>
              <p className="mt-3 max-w-2xl font-body leading-relaxed text-ink-soft">
                {plain(p.blurb, 400)}
              </p>
              <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-body text-[15px]">
                {p.repo && <Out href={p.repo}>code</Out>}
                {p.demo && <Out href={p.demo}>live demo</Out>}
                {p.article && <Out href={p.article}>write-up</Out>}
                {p.results && <Out href={p.results}>results</Out>}
              </p>
              <Shot project={p} />
            </li>
          ))}
        </ol>
        <p className="mt-10 font-body text-[15px] text-ink-soft">
          {picked.length} of {projects.length} projects, chosen for this role.{" "}
          <Link className="underline decoration-blush decoration-2 underline-offset-4" href="/work">
            All of them ↗
          </Link>
        </p>
      </Section>

      {research.length > 0 && (
        <Section label={t("recruiter.heading.research")}>
          <ol className="mt-8 space-y-10">
            {research.map((e) => (
              <Entry key={plain(e.title)} e={e} />
            ))}
          </ol>
        </Section>
      )}

      <Section label={t("recruiter.heading.experience")}>
        <ol className="mt-8 space-y-10">
          {jobs.map((e) => (
            <Entry key={plain(e.title)} e={e} />
          ))}
        </ol>
      </Section>

      <Section label={t("recruiter.heading.education")}>
        <ol className="mt-8 space-y-10">
          {education.map((e) => (
            <Entry key={plain(e.title)} e={e} />
          ))}
        </ol>
      </Section>

      <Section label={t("recruiter.heading.skills")}>
        <ul className="mt-8 grid gap-x-10 gap-y-3 sm:grid-cols-2">
          {spec.skills.map((s) => (
            <li key={s} className="font-body">
              {s}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

/**
 * A screenshot of the running thing, or a diagram of how it works: on this page
 * one picture argues better than another paragraph.
 *
 * The empty state is deliberately visible rather than absent. A project with no
 * picture yet says so, which is the reminder to go and add one; a blank space
 * would just look like the layout breathing.
 */
function Shot({ project }: { project: { name: string; image?: { id: string; name: string } } }) {
  if (!project.image) {
    return (
      <div className="mt-6 flex h-44 items-center justify-center rounded-2xl border border-dashed border-ink/20 bg-white/40">
        <p className="font-body text-[13px] text-ink-soft/60">
          no picture yet ✦ add one in the atelier
        </p>
      </div>
    );
  }
  return (
    <figure className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/attachment/${project.image.id}`}
        alt={`${project.name} screenshot`}
        loading="lazy"
        decoding="async"
        className="w-full"
      />
    </figure>
  );
}

function Out({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="font-semibold underline decoration-blush decoration-2 underline-offset-4">
      {children} ↗
    </a>
  );
}

function Entry({ e }: { e: AboutEntry }) {
  return (
    <li>
      <p className={LABEL}>{plain(e.when)}</p>
      <h3 className="mt-2.5 font-body text-xl font-bold tracking-tight">
        {plain(e.title)}
        {e.subtitle && <span className="font-medium">, {plain(e.subtitle)}</span>}
      </h3>
      <p className="font-body text-[15px] text-ink-soft">{plain(e.place)}</p>
      <p className="mt-2.5 max-w-2xl font-body leading-relaxed text-ink-soft">
        {plain(e.note, 500)}
      </p>
    </li>
  );
}
