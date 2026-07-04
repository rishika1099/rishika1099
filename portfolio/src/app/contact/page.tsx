import ContactClient from "@/components/ContactClient";
import { getCopy } from "@/lib/siteCopy";
import { copyToHtml } from "@/lib/copyRender";
import { getContactLinks } from "@/lib/contactLinks";

export const metadata = { title: "Contact" };
// the intro passage is editable in the atelier (/edit)
export const dynamic = "force-dynamic";

export default async function Contact() {
  const [copy, links] = await Promise.all([getCopy(), getContactLinks()]);
  return (
    <ContactClient
      intro={<span className="rich-passage" dangerouslySetInnerHTML={{ __html: copyToHtml(copy["contact.intro"]) }} />}
      links={links}
    />
  );
}
