import AboutClient from "@/components/AboutClient";
import { getAboutEntries } from "@/lib/aboutData";
import { getCopy } from "@/lib/siteCopy";
import { copyToHtml } from "@/lib/copyRender";
import RichText from "@/components/RichText";
import { richToText } from "@/lib/richHtml";

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
      navLabels={{
        education: richToText(copy["about.nav.education"], 40) || "🎓 education",
        skills: richToText(copy["about.nav.skills"], 40) || "🛠️ skills",
        work: richToText(copy["about.nav.work"], 40) || "💼 work",
        research: richToText(copy["about.nav.research"], 40) || "🔬 research",
        certifications: richToText(copy["about.nav.certifications"], 40) || "📜 certifications",
      }}
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
