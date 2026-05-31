import { cookies } from "next/headers";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import PoemGate from "@/components/PoemGate";
import LockButton from "@/components/LockButton";
import PoemRoom from "@/components/PoemRoom";
import { POEM_COOKIE, verifyToken } from "@/lib/auth";
import { listPoems } from "@/lib/poems-store";

export const metadata = { title: "Poems" };

export default async function PoemsPage() {
  const cookieStore = await cookies();
  const unlocked = verifyToken(cookieStore.get(POEM_COOKIE)?.value);

  return (
    <PageShell vibe="twilight">
      <Link
        href="/blog"
        className="font-body text-sm text-lavender/90 hover:text-white"
      >
        ← back to the writing room
      </Link>
      <PageTitle className="mt-2 text-cream">poems 🕯️</PageTitle>

      {!unlocked ? (
        <PoemGate />
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between">
            <p className="font-body text-lg text-lavender">
              welcome in, make yourself a cup of something warm
            </p>
            <LockButton />
          </div>

          <PoemRoom poems={await listPoems()} />
        </>
      )}
    </PageShell>
  );
}
