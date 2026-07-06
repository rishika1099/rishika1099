import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import { getCopy } from "@/lib/siteCopy";
import { copyToHtml } from "@/lib/copyRender";
import { richToText } from "@/lib/richHtml";
import RichText from "@/components/RichText";

export const metadata: Metadata = {
  title: "Now",
  description: "What Rishika is working on, learning, and enjoying right now.",
};

// everything on this page is editable at /now/edit
export const dynamic = "force-dynamic";

const NOW_SECTIONS: { id: string; emoji: string; title: string }[] = [
  { id: "now.working", emoji: "🌱", title: "working on" },
  { id: "now.learning", emoji: "📚", title: "learning" },
  { id: "now.tinkering", emoji: "🛠️", title: "tinkering" },
  { id: "now.offclock", emoji: "🍵", title: "off the clock" },
];

export default async function NowPage() {
  const copy = await getCopy();
  const tools = richToText(copy["now.tools"], 400)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  return (
    <PageShell vibe="honey">
      <PageTitle><RichText html={copyToHtml(copy["now.title"])} /></PageTitle>
      <p
        className="rich-passage mt-3 max-w-2xl font-body text-lg text-ink-soft [&_a]:font-semibold [&_a]:text-[#c77dba] [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: copyToHtml(copy["now.intro"]) }}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {NOW_SECTIONS.map((s) => (
          <section key={s.id} className="rounded-3xl p-6 soft-card">
            <h2 className="font-body text-lg font-bold text-ink">
              <span className="mr-2">{s.emoji}</span>
              <RichText html={copyToHtml(copy[s.id.replace("now.", "now.head.")])} />
            </h2>
            <div
              className="rich-passage mt-3 font-body text-sm text-ink-soft"
              dangerouslySetInnerHTML={{ __html: copyToHtml(copy[s.id]) }}
            />
          </section>
        ))}
      </div>

      <h2 className="mt-10 font-body text-lg font-bold text-ink">
        <RichText html={copyToHtml(copy["now.head.tools"])} />
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {tools.map((t) => (
          <span
            key={t}
            className="rounded-full bg-white/70 px-3.5 py-1 font-body text-sm font-semibold text-ink-soft"
          >
            {t}
          </span>
        ))}
      </div>
    </PageShell>
  );
}
