import { cookies } from "next/headers";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import PageShell from "@/components/PageShell";
import PoemGate from "@/components/PoemGate";
import LockButton from "@/components/LockButton";
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

          <div className="mt-8 space-y-6">
            {getPoems().map((poem) => (
              <article
                key={poem.slug}
                className="rounded-3xl border border-white/15 bg-white/5 p-7 backdrop-blur-sm sm:p-9"
              >
                <h2 className="font-display text-2xl font-semibold text-cream">
                  {poem.title}
                </h2>
                {poem.date && (
                  <p className="font-hand text-base text-lavender/80">
                    {poem.date}
                  </p>
                )}
                <div className="prose-poem mt-4 whitespace-pre-line font-serif text-lg leading-relaxed text-cream/90">
                  <ReactMarkdown>{poem.content}</ReactMarkdown>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}
