import { redirect } from "next/navigation";

// /contact/edit opens the atelier focused on this page's passages
export default function EditRedirect() {
  redirect("/edit?tab=passages&page=contact");
}
