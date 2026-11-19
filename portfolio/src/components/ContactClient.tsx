"use client";

import { m } from "framer-motion";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import styles from "./ContactLayout.module.css";
import ContactForm from "@/components/ContactForm";
import AnimalVisitor from "@/components/AnimalVisitor";
import Guestbook from "@/components/Guestbook";

import type { ContactLink } from "@/lib/contactLinks";

export default function ContactClient({
  title,
  intro,
  links,
  copy,
}: {
  title: React.ReactNode;
  intro: React.ReactNode;
  links: ContactLink[];
  copy?: Record<string, string>;
}) {
  return (
    <PageShell vibe="rose" className={`${styles.page} flex flex-col items-center text-center`}>
      <m.span
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="text-6xl"
      >
        📮
      </m.span>
      <PageTitle className="mt-3 text-ink">{title}</PageTitle>
      <div className="mt-3 max-w-xl font-body text-lg text-ink-soft">{intro}</div>

      <div className="mt-9 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((l, i) => (
          <m.a
            key={l.label}
            href={l.href}
            target={l.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -5, rotate: i % 2 ? 1.5 : -1.5 }}
            className="flex min-w-0 items-center gap-3 rounded-3xl p-5 text-left soft-card"
          >
            <span className="text-3xl">{l.icon}</span>
            <span className="min-w-0 break-words">
              <span className="block font-display font-semibold text-ink">
                {l.label}
              </span>
              <span className="font-body text-sm text-ink-soft">{l.value}</span>
            </span>
          </m.a>
        ))}
      </div>

      <Guestbook copy={copy} contactForm={<ContactForm copy={copy} />} companion={<AnimalVisitor animal="cat" />} />

      {copy?.["contact.neighbor"]?.trim() && (
        <m.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rich-passage mx-auto mt-12 max-w-xl text-center font-body text-base text-ink-soft [&_a]:font-semibold [&_a]:text-[#c77dba] [&_a]:underline hover:[&_a]:text-ink"
          dangerouslySetInnerHTML={{ __html: copy["contact.neighbor"] }}
        />
      )}


    </PageShell>
  );
}
