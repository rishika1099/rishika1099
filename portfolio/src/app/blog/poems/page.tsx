import { cookies } from "next/headers";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import PoemGate from "@/components/PoemGate";
import LockButton from "@/components/LockButton";
import PoemRoom from "@/components/PoemRoom";
import { POEM_COOKIE, verifyToken } from "@/lib/auth";
import { getPoems } from "@/lib/content";

export const metadata = { title: "Poems — Rishika" };

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
      <h1 className="mt-2 font-display text-4xl font-bold text-cream sm:text-5xl">
        poems 🕯️
      </h1>

      {!unlocked ? (
        <PoemGate />
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between">
            <p className="font-hand text-xl text-lavender">
              welcome in — make yourself a cup of something warm
            </p>
            <LockButton />
          </div>

          <PoemRoom poems={getPoems()} />
        </>
      )}
    </PageShell>
  );
}
