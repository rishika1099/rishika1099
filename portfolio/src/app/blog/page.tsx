import BlogHubClient from "@/components/BlogHubClient";
import { getCopy } from "@/lib/siteCopy";

export const metadata = { title: "Blog" };
// the intro passage is editable in the atelier (/edit)
export const dynamic = "force-dynamic";

export default async function BlogHub() {
  const copy = await getCopy();
  return <BlogHubClient intro={copy["blog.intro"]} />;
}
