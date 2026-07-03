import { redirect } from "next/navigation";

// /blog/technical/edit opens the atelier focused on this page's passages
export default function EditRedirect() {
  redirect("/edit?tab=passages&page=blog");
}
