import WorkEditClient from "@/components/WorkEditClient";
import { getAllProjects } from "@/lib/github-projects";
import { categories, domains } from "@/data/projects";

export const dynamic = "force-dynamic";

export default async function WorkEdit() {
  const projects = await getAllProjects();
  return <WorkEditClient projects={projects} categories={categories} domains={domains} />;
}
