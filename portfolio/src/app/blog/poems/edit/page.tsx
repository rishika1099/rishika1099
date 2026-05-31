import { cookies } from "next/headers";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import AdminGate from "@/components/AdminGate";
import PoemEditor from "@/components/PoemEditor";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";
import { listPoems } from "@/lib/poems-store";

export const metadata = {
  title: "the writing desk",
  robots: { index: false, follow: false },
};

export default async function PoemEditPage() {
  const cookieStore = await cookies();
  const isAdmin = verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);

  return (
    <PageShell vibe="twilight">
      <Link
        href="/blog/poems"
        className="font-body text-sm text-lavender/90 hover:text-white"
      >
        ← back to the poems
      </Link>
      <PageTitle className="mt-2 text-cream">the writing desk 🖋️</PageTitle>

      {!isAdmin ? <AdminGate /> : <PoemEditor initialPoems={await listPoems()} />}
    </PageShell>
  );
}
