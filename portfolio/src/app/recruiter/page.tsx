import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import RecruiterEntries from "@/components/RecruiterEntries";
import PipelineDiagram from "@/components/PipelineDiagram";
import PipelineLoader from "@/components/PipelineLoader";
import CaseStudyOpener from "@/components/CaseStudyCard";
import ProjectActions from "@/components/ProjectActions";
import CaseStudyLoader from "@/components/CaseStudyLoader";
import { getAllProjects } from "@/lib/github-projects";
import { getAboutEntries } from "@/lib/aboutData";
import { getPipeline, type Pipeline } from "@/lib/pipeline";
import { getCaseStudy, hasContent } from "@/lib/caseStudies";
import { getAutoCaseStudy } from "@/lib/caseStudyAuto";
import { repoSlug } from "@/lib/projectOverrides";
import { getCopy } from "@/lib/siteCopy";
import { isResearchEntry } from "@/lib/aboutSections";
import { categoryStyle, domainColor, domainEmoji, type Domain } from "@/data/projects";
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

/** The same heading the About page uses for its sections. */
function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-14 font-body text-2xl font-bold text-ink">{children}</h2>;
}

function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <span
      style={{ backgroundColor: color ?? "#d8efe2" }}
      className="rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink"
    >
      {label}
    </span>
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
  // Read-only: a cached diagram is drawn, a missing one is fetched by the card
  // itself. Generating here would make a recruiter wait on an LLM call.
  const pipelines = await Promise.all(picked.map((p) => getPipeline(repoSlug(p.repo))));
  // Authored first, then whatever has been drafted from the repo. Read-only in
  // both cases: anything missing is asked for by the card itself, so the page
  // never waits on a model call.
  const studies = await Promise.all(
    picked.map(async (p) => {
      const slug = repoSlug(p.repo);
      const written = await getCaseStudy(slug);
      if (written && hasContent(written)) return written;
      const drafted = await getAutoCaseStudy(slug);
      return drafted && hasContent(drafted) ? drafted : null;
    }),
  );
  const research = researchForRole(timeline.filter(isResearchEntry), role);
  const jobs = timeline.filter((e) => !isResearchEntry(e));

  return (
    <>
      <Heading>{t("recruiter.heading.projects")} 🌱</Heading>
      <p className="mt-1 font-body text-sm text-ink-soft">
        {picked.length} of {projects.length}, the ones that argue for this role ✦
      </p>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {picked.map((p, i) => (
          <article key={p.name} className="flex flex-col rounded-3xl p-6 soft-card">
            <div className="flex items-start gap-4">
              <span className="text-3xl">{p.emoji}</span>
              <div className="min-w-0 flex-1">
                <h3 className="font-body text-xl font-bold text-ink">{p.name}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.domains?.map((d) => (
                    <Chip
                      key={d}
                      label={`${domainEmoji[d as Domain] ?? "✦"} ${d}`}
                      color={domainColor[d as Domain]}
                    />
                  ))}
                  {p.categories.map((c) => (
                    <Chip
                      key={c}
                      label={`${categoryStyle[c]?.emoji ?? "✦"} ${c}`}
                      color={categoryStyle[c]?.color}
                    />
                  ))}
                </div>
                <p className="mt-3 font-body text-[15px] leading-relaxed text-ink-soft">
                  {plain(p.blurb, 400)}
                </p>
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-body text-sm">
                  {p.repo && <Out href={p.repo}>★ code</Out>}
                  {p.demo && <Out href={p.demo}>✿ live demo</Out>}
                  {p.article && <Out href={p.article}>📰 write-up</Out>}
                  {p.results && <Out href={p.results}>📊 results</Out>}
                </p>
                {studies[i] ? (
                  <CaseStudyOpener study={studies[i]!} name={p.name} pipeline={pipelines[i]} />
                ) : (
                  <CaseStudyLoader
                    slug={repoSlug(p.repo)}
                    name={p.name}
                    pipeline={pipelines[i]}
                  />
                )}
                <ProjectActions name={p.name} />
              </div>
            </div>
            <div className="mt-auto">
              <Shot project={p} pipeline={pipelines[i]} slug={repoSlug(p.repo)} />
            </div>
          </article>
        ))}
      </div>
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

      <Heading>{t("recruiter.heading.skills")} 🛠️</Heading>
      <div className="mt-5 flex flex-wrap gap-2">
        {spec.skills.map((s) => (
          <span
            key={s}
            className="rounded-full bg-white/70 px-4 py-1.5 font-body text-sm font-semibold text-ink-soft"
          >
            {s}
          </span>
        ))}
      </div>

      <p className="mt-14 font-body text-sm text-ink-soft">
        This is the short version, for {spec.article}.{" "}
        <Link className="underline decoration-[#a9a5e6] decoration-2 underline-offset-4" href="/about">
          the longer one lives here
        </Link>{" "}
        ✦
      </p>
    </>
  );
}

function Out({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="font-semibold text-ink-soft underline decoration-[#a9a5e6] decoration-2 underline-offset-4 transition hover:text-ink"
    >
      {children}
    </a>
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
function Shot({
  project,
  pipeline,
  slug,
}: {
  project: { name: string; image?: { id: string; name: string } };
  pipeline: Pipeline | null;
  slug: string;
}) {
  // an uploaded picture always wins: she chose it
  if (project.image) {
    return (
      <figure className="mt-5 overflow-hidden rounded-2xl bg-white/70 ring-1 ring-white/70">
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
  if (pipeline) return <PipelineDiagram pipeline={pipeline} label={project.name} />;
  // nothing cached yet: the card asks for one itself, so the page never waits
  return <PipelineLoader slug={slug} name={project.name} />;
}
