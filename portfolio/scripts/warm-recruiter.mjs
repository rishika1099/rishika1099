// Warms the recruiter page's generated content ahead of anyone reading it.
//
// The page drafts a missing case study during the render, under a deadline, so
// nothing ever appears seconds late. That is the safety net, not the plan: the
// plan is that everything is already cached, and the deadline never fires. Run
// this after publishing a repo, or after a deploy that changed the roles.
//
//   npm run warm            # against the live site
//   npm run warm -- http://localhost:3000
//
// Every project that can appear under any role is asked for once. Both
// endpoints are public and cache-on-write, so this is just a reader that
// happens to leave the cache full.

const base = (process.argv[2] || "https://rishika-m.com").replace(/\/$/, "");
const ROLES = ["data-scientist", "ml-engineer", "ai-engineer", "software-engineer"];

const slugOf = (repo) => (repo || "").split("/").pop()?.toLowerCase() ?? "";

async function main() {
  const res = await fetch(`${base}/api/recruiter-projects`);
  if (!res.ok) {
    console.error(`could not list the recruiter projects (${res.status})`);
    process.exit(1);
  }
  const { byRole } = await res.json();

  const slugs = [...new Set(ROLES.flatMap((r) => (byRole?.[r] ?? []).map(slugOf)))].filter(Boolean);
  console.log(`warming ${slugs.length} projects across ${ROLES.length} roles\n`);

  let drawn = 0;
  let written = 0;
  for (const slug of slugs) {
    // one at a time: this is a background chore, not a race, and the model is
    // happier not being asked twenty things at once
    const [pipe, study] = await Promise.all([
      fetch(`${base}/api/pipeline?slug=${slug}`).then((r) => r.json()).catch(() => ({})),
      fetch(`${base}/api/case-study?slug=${slug}`).then((r) => r.json()).catch(() => ({})),
    ]);
    const p = pipe?.pipeline ? "diagram" : "no diagram";
    const c = study?.caseStudy ? "case study" : "no case study";
    if (pipe?.pipeline) drawn++;
    if (study?.caseStudy) written++;
    console.log(`  ${slug.padEnd(42)} ${p.padEnd(12)} ${c}`);
  }

  console.log(`\n${drawn}/${slugs.length} have a diagram, ${written}/${slugs.length} a case study.`);
  console.log("the ones without are repos whose readme does not support one, which is fine.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
