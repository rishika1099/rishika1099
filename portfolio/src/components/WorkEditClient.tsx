"use client";

// In-place editor for the Work page: the real gallery, filters, and galaxy
// render below; only the intro passage is editable.

import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import WorkGallery from "@/components/WorkGallery";
import ProjectGalaxy from "@/components/ProjectGalaxy";
import { AdminGate } from "@/components/editing";
import { usePassageEditor } from "@/components/usePassageEditor";
import type { Category, Domain, Project } from "@/data/projects";

function Editor({
  keyVal,
  projects,
  categories,
  domains,
}: {
  keyVal: string;
  projects: Project[];
  categories: Category[];
  domains: Domain[];
}) {
  const { ready, box, bar } = usePassageEditor(keyVal, ["work.intro"], "/work");
  if (!ready)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;
  return (
    <PageShell vibe="meadow">
      {bar}
      <PageTitle>my little meadow of projects 🌱</PageTitle>
      <p className="mt-1 font-body text-[11px] text-ink-soft/60">
        {"{count}"} becomes the live project count ({projects.length} right now):
      </p>
      <div className="max-w-4xl">{box("work.intro", "font-body text-lg text-ink-soft")}</div>
      <p className="mt-3 font-body text-xs text-ink-soft/70">
        the projects below pull from GitHub on their own, edit them there ✦
      </p>
      <WorkGallery projects={projects} categories={categories} domains={domains} />
      <ProjectGalaxy />
    </PageShell>
  );
}

export default function WorkEditClient(props: {
  projects: Project[];
  categories: Category[];
  domains: Domain[];
}) {
  return <AdminGate vibe="meadow">{(key) => <Editor keyVal={key} {...props} />}</AdminGate>;
}
