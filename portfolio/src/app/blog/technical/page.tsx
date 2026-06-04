import Link from "next/link";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import { getBlogPosts } from "@/lib/content";
import { getSubstackPosts } from "@/lib/substack";
import { domainColor } from "@/data/projects";

export const metadata = { title: "Technical Blogs" };
export const revalidate = 3600; // re-check Substack hourly

// the /p/<slug> part of a Substack URL, to dedupe against curated entries
const postSlug = (url?: string) => url?.match(/\/p\/([^/?#]+)/)?.[1];

// one friendly date style for every post (local + Substack)
const fmtDate = (raw: string) => {
  // bare YYYY-MM-DD parses as UTC midnight, which can render a day early in
  // US timezones, so pin it to local noon before formatting
  const d = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T12:00:00`)
    : new Date(raw);
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
};

export default async function TechnicalIndex() {
  const local = getBlogPosts();
  const localSlugs = new Set(local.map((p) => postSlug(p.external)).filter(Boolean));
  const substack = (await getSubstackPosts()).filter(
    (s) => !localSlugs.has(postSlug(s.external)),
  );
  const posts = [...local, ...substack].sort(
    (a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0),
  );
  return (
    <PageShell vibe="azure">
      <PageTitle className="text-ink">technical blogs 📓</PageTitle>
      <div className="mt-3">
        <Link href="/blog" className="font-body text-sm text-ink-soft hover:text-ink">
          ← back to the writing room
        </Link>
      </div>
      <p className="mt-3 max-w-2xl font-body text-lg text-ink-soft">
        ideas that refused to stay inside a notebook 💡
      </p>

      <div className="mt-8 space-y-4">
        {posts.length === 0 && (
          <p className="font-hand text-xl text-ink-soft">
            no posts yet, they&apos;re still brewing ☕
          </p>
        )}
        {posts.map((p) => {
          const cardClass =
            "block rounded-3xl p-6 soft-card transition hover:-translate-y-1";
          const inner = (
            <>
              <p className="font-hand text-lg text-ink-soft">{fmtDate(p.date)}</p>
              <h2 className="font-display text-xl font-semibold text-ink">
                {p.title}
              </h2>
              <p className="mt-1 font-body text-sm text-ink-soft">{p.excerpt}</p>
              {Boolean(p.domains?.length || p.tech?.length) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.domains?.map((d) => (
                    <span
                      key={d}
                      style={{ backgroundColor: domainColor[d] }}
                      className="rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink"
                    >
                      {d}
                    </span>
                  ))}
                  {p.tech?.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-mint/70 px-2.5 py-0.5 font-body text-[11px] font-semibold text-ink-soft"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <span className="mt-3 inline-block font-body text-sm font-semibold text-[#c77dba]">
                {p.external ? "read on Substack ↗" : "read on →"}
              </span>
            </>
          );
          return p.external ? (
            <a
              key={p.slug}
              href={p.external}
              target="_blank"
              rel="noreferrer"
              className={cardClass}
            >
              {inner}
            </a>
          ) : (
            <Link key={p.slug} href={`/blog/technical/${p.slug}`} className={cardClass}>
              {inner}
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
