import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import WorkGallery from "@/components/WorkGallery";
import ProjectGalaxy from "@/components/ProjectGalaxy";
import { categories, domains } from "@/data/projects";
import { getAllProjects } from "@/lib/github-projects";
import { getCopy } from "@/lib/siteCopy";
import { copyToHtml } from "@/lib/copyRender";
import RichText from "@/components/RichText";

export const metadata = { title: "Work" };

export default async function Work() {
  const projects = await getAllProjects();
  const copy = await getCopy();
  const intro = copyToHtml(copy["work.intro"]).replace("{count}", String(projects.length));

  // the built-in taxonomy plus any custom tags added to projects in the atelier,
  // so a hand-added area (reinforcement learning, robotics, …) still gets a filter
  const allCategories = Array.from(new Set([...categories, ...projects.flatMap((p) => p.categories)]));
  const allDomains = Array.from(new Set([...domains, ...projects.flatMap((p) => p.domains ?? [])]));

  return (
    <PageShell vibe="meadow">
      <PageTitle><RichText html={copyToHtml(copy["work.title"])} /></PageTitle>
      <p className="mt-3 max-w-4xl font-body text-lg text-ink-soft">
        <span className="rich-passage" dangerouslySetInnerHTML={{ __html: intro }} />
      </p>

      <WorkGallery projects={projects} categories={allCategories} domains={allDomains} />
      <ProjectGalaxy copy={copy} />
    </PageShell>
  );
}
