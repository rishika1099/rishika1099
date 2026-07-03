import AboutClient from "@/components/AboutClient";
import { getAboutEntries } from "@/lib/aboutData";
import { getCopy } from "@/lib/siteCopy";

export const metadata = { title: "About" };
// entries + bio can be edited in the secret /edit room (Blobs overrides),
// so this page renders fresh instead of being frozen at build time
export const dynamic = "force-dynamic";

export default async function About() {
  const [{ education, timeline }, copy] = await Promise.all([getAboutEntries(), getCopy()]);
  const bio = copy["about.bio"].split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return <AboutClient education={education} timeline={timeline} bio={bio} />;
}
