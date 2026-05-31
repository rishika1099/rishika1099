import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import WorkGallery from "@/components/WorkGallery";
import { categories, domains } from "@/data/projects";
import { getAllProjects } from "@/lib/github-projects";

export const metadata = { title: "Work" };

export default async function Work() {
  const projects = await getAllProjects();

  return (
    <PageShell vibe="meadow">
      <PageTitle>my little meadow of projects 🌱</PageTitle>
      <p className="mt-3 max-w-2xl font-body text-lg text-ink-soft">
        {projects.length} things I&apos;ve grown, from clinical LLM systems to
        causal studies to weekend ML experiments. New projects sprout here on
        their own as I push them to GitHub. The big blooms are below; pick a
        patch to wander through the rest.
      </p>

      <WorkGallery projects={projects} categories={categories} domains={domains} />
    </PageShell>
  );
}
