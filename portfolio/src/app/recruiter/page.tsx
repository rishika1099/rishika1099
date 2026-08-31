import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import RecruiterEntries from "@/components/RecruiterEntries";
import RecruiterView from "@/components/RecruiterView";
import { getAllProjects } from "@/lib/github-projects";
import { getAboutEntries } from "@/lib/aboutData";
import { buildPipeline, getPipeline } from "@/lib/pipeline";
import { getCaseStudy, hasContent } from "@/lib/caseStudies";
import { buildAutoCaseStudy, getAutoCaseStudy } from "@/lib/caseStudyAuto";
import { angleEntries } from "@/lib/angle";
import { repoSlug } from "@/lib/projectOverrides";
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
 * How long the page will wait for a draft before rendering without it. Long
 * enough that a warm-ish cache and a fast model call both land, short enough
 * that nobody stares at a blank tab: the whole point is that the case study is
 * there when the page is.
 */
const DRAFT_MS = 4000;

/** The value if it arrives in time, otherwise null. The work continues either way. */
function withDeadline<T>(work: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    work.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/**
 * Her site with the volume down, not a different site.
 *
 * Same shell, same cards, same pastel chips, same handwritten page title. What
 * goes is the wandering: no shelves to scroll sideways, no embeddings galaxy,
 * no explain-like-I'm-five toggle, no thirteen patches to choose between. One
 * column, one question answered, and everything between the reader and that
 * answer removed.
 *
 * The first attempt at this was plain, and plain came out looking like a
 * stranger's resume. Someone who has just read the rest of the site should
 * recognise this page as the same person's.
 */
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
    <PageShell vibe="periwinkle">
      <PageTitle>{t("recruiter.title")} 🌷</PageTitle>

      <p className="mt-5 max-w-2xl font-body text-lg leading-relaxed text-ink-soft">
        {role ? t(`recruiter.summary.${role}`) : t("recruiter.intro")}
      </p>

      {/* The question. Real links, so a chosen role is a URL she can send. */}
      <section className="mt-8">
        <p className="font-body text-sm font-semibold text-ink-soft">{t("recruiter.ask")}</p>
        <nav className="mt-3 flex flex-wrap gap-2">
          {ROLES.map((r) => {
            const on = r === role;
            return (
              <Link
                key={r}
                href={`/recruiter?role=${r}`}
                aria-current={on ? "page" : undefined}
                // in the page's own periwinkle rather than the site's ink: a
                // dark pill on a pale ground read as borrowed from another page
                style={{ backgroundColor: on ? "#c2c0ef" : "rgba(255,255,255,0.62)" }}
                className={`rounded-full px-5 py-2 font-body text-sm font-semibold transition ${
                  on ? "text-ink shadow-sm ring-1 ring-white/70" : "text-ink-soft hover:text-ink"
                }`}
              >
                {ROLE_SPECS[r].label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-4 font-body text-sm text-ink-soft">
          <a
            style={{ backgroundColor: "#d3d1f5" }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-semibold text-ink ring-1 ring-white/70 transition hover:brightness-[0.97]"
            href="/resume"
            download="Rishika_Mamidibathula_Resume.pdf"
          >
            ⬇ download the résumé
          </a>{" "}
          <Link className="ml-2 underline decoration-[#a9a5e6] decoration-2 underline-offset-4" href="/resume/print">
            or read it as a page
          </Link>
        </p>
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
        // No role picked yet: the constant half of the page is still worth
        // reading, and the posting box is the other way of asking the question,
        // so it has to be here too rather than behind a role.
        <RecruiterView
          projects={[]}
          slugs={[]}
          studies={[]}
          pipelines={[]}
          images={[]}
          skills={[]}
          angles={{}}
          projectsLabel={t("recruiter.heading.projects")}
          projectsHint=""
          skillsLabel={t("recruiter.heading.skills")}
          jdLabel={t("recruiter.jd.label")}
          jdHint={t("recruiter.jd.hint")}
        >
          <Heading>{t("recruiter.heading.research")} 🔬</Heading>
          <RecruiterEntries entries={timeline.filter(isResearchEntry)} />

          <Heading>{t("recruiter.heading.experience")} 💼</Heading>
          <RecruiterEntries
            entries={timeline.filter((e) => !isResearchEntry(e))}
            columns={1}
            showFiles
            showAttachments={false}
          />

          <Heading>{t("recruiter.heading.education")} 🎓</Heading>
          <RecruiterEntries entries={education} />
        </RecruiterView>
      )}

      {!role && (
        <p className="mt-10 font-body text-ink-soft">
          Or wander{" "}
          <Link className="underline decoration-[#a9a5e6] decoration-2 underline-offset-4" href="/">
            the whole site
          </Link>
          , which has everything and rather more colour ✦
        </p>
      )}
    </PageShell>
  );
}

async function RoleView({
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
  // Same bargain as the case studies: drawn now if it can be, under the same
  // deadline, rather than appearing a few seconds after the reader arrived.
  const pipelines = await Promise.all(
    picked.map(async (p) => {
      const slug = repoSlug(p.repo);
      const cached = await getPipeline(slug);
      return cached ?? (await withDeadline(buildPipeline(slug), DRAFT_MS));
    }),
  );
  // Authored first, then whatever has been drafted from the repo.
  //
  // Reading only, and letting the cards fetch the rest, meant a cold project's
  // button appeared several seconds after the page did: a recruiter scanning
  // it would have moved on before the best part loaded. So a missing one is
  // drafted here, under a deadline, and the deadline is what keeps that safe.
  // A draft that overruns keeps going and writes to the cache anyway, so it is
  // there for the next visitor; only this render gives up on it, and only that
  // card falls back to fetching client-side.
  const studies = await Promise.all(
    picked.map(async (p) => {
      const slug = repoSlug(p.repo);
      const written = await getCaseStudy(slug);
      if (written && hasContent(written)) return written;
      const cached = await getAutoCaseStudy(slug);
      if (cached && hasContent(cached)) return cached;
      const drafted = await withDeadline(buildAutoCaseStudy(slug), DRAFT_MS);
      return drafted && hasContent(drafted) ? drafted : null;
    }),
  );
  const research = researchForRole(timeline.filter(isResearchEntry), role);
  const jobs = timeline.filter((e) => !isResearchEntry(e));

  // Her entries re-angled toward this role: the human-rights LLM research is
  // the closest thing she has to a healthcare LLM job, and should not read as
  // irrelevant just because the subject differs. Cached per role, since the
  // four roles are fixed, and under the same deadline as everything else.
  const angles =
    (await withDeadline(
      angleEntries([...jobs, ...research, ...education], spec.article, `role-${role}`),
      DRAFT_MS,
    )) ?? {};

  return (
    <RecruiterView
      angles={angles}
      projects={picked}
      slugs={picked.map((p) => repoSlug(p.repo))}
      studies={studies}
      pipelines={pipelines}
      images={picked.map((p) => p.image)}
      skills={spec.skills}
      projectsLabel={t("recruiter.heading.projects")}
      projectsHint={`${picked.length} of ${projects.length}, the ones that argue for this role ✦`}
      skillsLabel={t("recruiter.heading.skills")}
      jdLabel={t("recruiter.jd.label")}
      jdHint={t("recruiter.jd.hint")}
    >
      <p className="mt-5 font-body text-sm text-ink-soft">
        <Link className="underline decoration-[#a9a5e6] decoration-2 underline-offset-4" href="/work">
          all {projects.length} projects →
        </Link>
      </p>

      {research.length > 0 && (
        <>
          <Heading>{t("recruiter.heading.research")} 🔬</Heading>
          <RecruiterEntries entries={research} />
        </>
      )}

      <Heading>{t("recruiter.heading.experience")} 💼</Heading>
      <RecruiterEntries entries={jobs} columns={1} showFiles showAttachments={false} />

      <Heading>{t("recruiter.heading.education")} 🎓</Heading>
      <RecruiterEntries entries={education} />
    </RecruiterView>
  );
}

/** The same heading the About page uses for its sections. */
function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-14 font-body text-2xl font-bold text-ink">{children}</h2>;
}


/**
 * A screenshot of the running thing, or a diagram of how it works: on this page
 * one picture argues better than another paragraph.
 *
 * The empty state is deliberately visible rather than absent. A project with no
 * picture yet says so, which is the reminder to go and add one; a blank space
 * would just look like the layout breathing.
 */
