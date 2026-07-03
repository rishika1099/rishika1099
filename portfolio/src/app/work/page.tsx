import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import WorkGallery from "@/components/WorkGallery";
import ProjectGalaxy from "@/components/ProjectGalaxy";
import { categories, domains } from "@/data/projects";
import { getAllProjects } from "@/lib/github-projects";
import { getCopy } from "@/lib/siteCopy";

export const metadata = { title: "Work" };

export default async function Work() {
  const projects = await getAllProjects();
  const copy = await getCopy();
  const intro = copy["work.intro"].replace("{count}", String(projects.length));

  return (
    <PageShell vibe="meadow">
      <PageTitle>my little meadow of projects 🌱</PageTitle>
      <p className="mt-3 max-w-4xl font-body text-lg text-ink-soft">
        {intro}
      </p>

      <WorkGallery projects={projects} categories={categories} domains={domains} />
      <ProjectGalaxy />
    </PageShell>
  );
}
