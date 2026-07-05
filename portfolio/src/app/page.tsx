import HomeClient from "@/components/HomeClient";
import { getCopy } from "@/lib/siteCopy";
import { copyToHtml } from "@/lib/copyRender";

// passages are editable in the atelier (/edit), so render fresh
export const dynamic = "force-dynamic";

export default async function Home() {
  const copy = await getCopy();
  return (
    <HomeClient
      name1={<span className="rich-passage" dangerouslySetInnerHTML={{ __html: copyToHtml(copy["home.name1"]) }} />}
      name2={<span className="rich-passage" dangerouslySetInnerHTML={{ __html: copyToHtml(copy["home.name2"]) }} />}
      greeting={<span dangerouslySetInnerHTML={{ __html: copyToHtml(copy["home.greeting"]) }} />}
      intro={<span className="rich-passage" dangerouslySetInnerHTML={{ __html: copyToHtml(copy["home.intro"]) }} />}
    />
  );
}
