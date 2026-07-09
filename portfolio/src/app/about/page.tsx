import AboutClient from "@/components/AboutClient";
import { getAboutEntries } from "@/lib/aboutData";
import { getCopy } from "@/lib/siteCopy";
import { copyToHtml } from "@/lib/copyRender";
import RichText from "@/components/RichText";

export const metadata = { title: "About" };
// entries + bio can be edited in the secret /edit room (Blobs overrides),
// so this page renders fresh instead of being frozen at build time
export const dynamic = "force-dynamic";

export default async function About() {
  const [{ education, timeline, certifications }, copy] = await Promise.all([getAboutEntries(), getCopy()]);
  return (
    <AboutClient
      education={education}
      timeline={timeline}
      certifications={certifications}
      bioHtml={copyToHtml(copy["about.bio"])}
      title={<RichText html={copyToHtml(copy["about.title"])} />}
      heads={{
        education: <RichText html={copyToHtml(copy["about.heading.education"])} />,
        skills: <RichText html={copyToHtml(copy["about.heading.skills"])} />,
        skillsSub: <RichText html={copyToHtml(copy["about.heading.skills.sub"])} />,
        work: <RichText html={copyToHtml(copy["about.heading.work"])} />,
        research: <RichText html={copyToHtml(copy["about.heading.research"])} />,
        certifications: <RichText html={copyToHtml(copy["about.heading.certifications"])} />,
      }}
    />
  );
}
