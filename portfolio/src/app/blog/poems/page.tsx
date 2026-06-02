import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import PoemsClient from "@/components/PoemsClient";

export const metadata = { title: "Poems" };

export default function PoemsPage() {
  return (
    <PageShell vibe="twilight">
      <PageTitle className="text-cream">poems 🕯️</PageTitle>
      <div className="mt-3">
        <Link
          href="/blog"
          className="font-body text-sm text-lavender/90 hover:text-white"
        >
          ← back to the writing room
        </Link>
      </div>

      <PoemsClient />
    </PageShell>
  );
}
