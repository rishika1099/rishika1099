import AboutClient from "@/components/AboutClient";
import { getAboutEntries } from "@/lib/aboutData";

export const metadata = { title: "About" };
// entries can be edited in the secret /edit room (stored as Blobs overrides),
// so this page renders fresh instead of being frozen at build time
export const dynamic = "force-dynamic";

export default async function About() {
  const { education, timeline } = await getAboutEntries();
  return <AboutClient education={education} timeline={timeline} />;
}
