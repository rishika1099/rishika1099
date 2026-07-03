import HomeClient from "@/components/HomeClient";
import { getCopy } from "@/lib/siteCopy";

// passages are editable in the atelier (/edit), so render fresh
export const dynamic = "force-dynamic";

export default async function Home() {
  const copy = await getCopy();
  return <HomeClient greeting={copy["home.greeting"]} intro={copy["home.intro"]} />;
}
