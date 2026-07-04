import HomeClient from "@/components/HomeClient";
import { getCopy } from "@/lib/siteCopy";
import { copyToHtml } from "@/lib/copyRender";

// passages are editable in the atelier (/edit), so render fresh
export const dynamic = "force-dynamic";

export default async function Home() {
  const copy = await getCopy();
  return (
    <HomeClient
      greeting={<span dangerouslySetInnerHTML={{ __html: copyToHtml(copy["home.greeting"]) }} />}
      intro={<span className="rich-passage" dangerouslySetInnerHTML={{ __html: copyToHtml(copy["home.intro"]) }} />}
    />
  );
}
