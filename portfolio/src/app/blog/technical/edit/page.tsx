import TechnicalEditClient from "@/components/TechnicalEditClient";
import { getTechnicalPosts } from "@/lib/technicalPosts";

export const dynamic = "force-dynamic";

export default async function TechnicalEdit() {
  const posts = await getTechnicalPosts();
  return <TechnicalEditClient posts={posts} />;
}
