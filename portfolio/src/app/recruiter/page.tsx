import Link from "next/link";
import type { Entry as AboutEntry } from "@/data/about";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import { getAllProjects } from "@/lib/github-projects";
import { getAboutEntries } from "@/lib/aboutData";
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
    <PageShell vibe="lilac">
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
                className={`rounded-full px-5 py-2 font-body text-sm font-semibold transition ${
                  on
                    ? "bg-ink text-cream shadow-sm"
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
        <p className="mt-10 font-body text-ink-soft">
          Or wander{" "}
          <Link className="underline decoration-blush decoration-2 underline-offset-4" href="/">
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
      <Heading>{t("recruiter.heading.projects")} 🌱</Heading>
      <p className="mt-1 font-body text-sm text-ink-soft">
        {picked.length} of {projects.length}, the ones that argue for this role ✦
      </p>
      <div className="mt-5 space-y-5">
        {picked.map((p) => (
          <article key={p.name} className="rounded-3xl p-6 soft-card">
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
              </div>
            </div>
            <Shot project={p} />
          </article>
        ))}
      </div>
      <p className="mt-5 font-body text-sm text-ink-soft">
        <Link className="underline decoration-blush decoration-2 underline-offset-4" href="/work">
          all {projects.length} projects →
        </Link>
      </p>

      {research.length > 0 && (
        <>
          <Heading>{t("recruiter.heading.research")} 🔬</Heading>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {research.map((e) => (
              <EntryCard key={plain(e.title)} e={e} />
            ))}
          </div>
        </>
      )}

      <Heading>{t("recruiter.heading.experience")} 💼</Heading>
      <div className="mt-5 space-y-4">
        {jobs.map((e) => (
          <EntryCard key={plain(e.title)} e={e} />
        ))}
      </div>

      <Heading>{t("recruiter.heading.education")} 🎓</Heading>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {education.map((e) => (
          <EntryCard key={plain(e.title)} e={e} />
        ))}
      </div>

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
        <Link className="underline decoration-blush decoration-2 underline-offset-4" href="/about">
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
      className="font-semibold text-ink-soft underline decoration-blush decoration-2 underline-offset-4 transition hover:text-ink"
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
function Shot({ project }: { project: { name: string; image?: { id: string; name: string } } }) {
  if (!project.image) {
    return (
      <div className="mt-5 flex h-40 items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-white/40">
        <p className="font-body text-[13px] text-ink-soft/60">
          no picture yet ✦ add one in the atelier
        </p>
      </div>
    );
  }
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

function EntryCard({ e }: { e: AboutEntry }) {
  return (
    <article className="rounded-3xl p-5 soft-card">
      <p className="font-body text-sm italic text-ink-soft">{plain(e.when)}</p>
      <h3 className="mt-0.5 font-body text-lg font-bold text-ink">
        {plain(e.title)}
        {e.subtitle && <span className="font-semibold text-ink/80">, {plain(e.subtitle)}</span>}
      </h3>
      <p className="font-body text-sm font-semibold text-ink-soft">{plain(e.place)}</p>
      <p className="mt-2 font-body text-[15px] leading-relaxed text-ink-soft">
        {plain(e.note, 500)}
      </p>
      {Boolean(e.domains?.length || e.tech?.length) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {e.domains?.map((d) => (
            <Chip key={d} label={d} color={domainColor[d as Domain]} />
          ))}
          {e.tech?.map((c) => (
            <Chip key={c} label={c} color={categoryStyle[c]?.color} />
          ))}
        </div>
      )}
    </article>
  );
}
