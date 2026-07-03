import ContactClient from "@/components/ContactClient";
import { getCopy } from "@/lib/siteCopy";

export const metadata = { title: "Contact" };
// the intro passage is editable in the atelier (/edit)
export const dynamic = "force-dynamic";

export default async function Contact() {
  const copy = await getCopy();
  return <ContactClient intro={copy["contact.intro"]} />;
}
