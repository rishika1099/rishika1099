import BlogHubClient from "@/components/BlogHubClient";
import { getCopy } from "@/lib/siteCopy";
import { copyToHtml } from "@/lib/copyRender";

export const metadata = { title: "Blog" };
// the intro passage is editable in the atelier (/edit)
export const dynamic = "force-dynamic";

export default async function BlogHub() {
  const copy = await getCopy();
  return (
    <BlogHubClient
      title={<span className="rich-passage" dangerouslySetInnerHTML={{ __html: copyToHtml(copy["blog.title"]) }} />}
      intro={<span className="rich-passage" dangerouslySetInnerHTML={{ __html: copyToHtml(copy["blog.intro"]) }} />}
      doorBlurbs={Object.fromEntries(
        ["technical", "poems", "photography"].map((k) => [
          k,
          <span key={k} className="rich-passage" dangerouslySetInnerHTML={{ __html: copyToHtml(copy[`blog.door.${k}`]) }} />,
        ]),
      )}
    />
  );
}
