"use client";

// A little guestbook: sign a note, see everyone else's, each tagged with an
// LLM-classified mood. Aggregate, no login. Honeypot for basic spam defense.

import { useEffect, useState, type ReactNode } from "react";

import { useFeatureCopy } from "./FeatureCopy";
import GuestbookGarden, { type GuestEntry } from "./GuestbookGarden";
import layout from "./ContactLayout.module.css";

const GB_DEFAULTS = {
  "contact.guestbook.title": "📖 sign the guestbook",
  "contact.guestbook.public": "🌸 public wall · everyone who visits sees this",
  "contact.guestbook.hint": "leave a little note, it gets a mood ✦ (a model reads the vibe, not you)",
  "contact.guestbook.placeholder.name": "your name (optional)",
  "contact.guestbook.placeholder.note": "say hi…",
  "contact.guestbook.empty": "no notes yet, be the first to pin one up ✦",
} as const;

export default function Guestbook({ copy, contactForm }: { copy?: Record<string, string>; contactForm: ReactNode }) {
  const text = useFeatureCopy();
  const t = (k: keyof typeof GB_DEFAULTS) => copy?.[k]?.trim() || GB_DEFAULTS[k];
  const [entries, setEntries] = useState<GuestEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  // note: guest notes are moderated from the atelier (GuestbookManager),
  // never from this public wall

  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    async function refresh() {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const response = await fetch("/api/guestbook", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!controller.signal.aborted) { setEntries(data.entries ?? []); setLoadError(false); }
      } catch {
        if (!controller.signal.aborted) setLoadError(true);
      } finally { pending = false; }
    }
    void refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 2) return;
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, message, website }),
      });
      const d = await r.json();
      if (r.status === 429) {
        setMsg(text("contact.guestbook.limit"));
      } else if (d.entry) {
        setEntries((cur) => [d.entry, ...(cur ?? [])]);
        setName("");
        setMessage("");
        setMsg(text("contact.guestbook.thanks"));
      } else {
        setMsg(text("contact.guestbook.error"));
      }
    } catch {
      setMsg(text("contact.guestbook.network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={layout.forms}>
      {contactForm}
      <section className={layout.guestCard}>
      <h2 className="font-display text-xl font-bold text-ink">{t("contact.guestbook.title")}</h2>
      <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-lavender/40 px-3 py-1 font-body text-xs font-semibold text-ink">
        {t("contact.guestbook.public")}
      </p>
      <p className="mt-2 font-body text-sm text-ink-soft">{t("contact.guestbook.hint")}</p>

      <form onSubmit={submit} className="mt-4 space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("contact.guestbook.placeholder.name")}
          aria-label={t("contact.guestbook.placeholder.name")}
          maxLength={40}
          className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-2 focus:ring-blush/30"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("contact.guestbook.placeholder.note")}
          aria-label={t("contact.guestbook.placeholder.note")}
          maxLength={500}
          className="min-h-20 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-2 font-body text-sm text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-2 focus:ring-blush/30"
        />
        {/* honeypot: hidden from people, catches bots */}
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-ink px-5 py-2 font-body text-sm font-semibold text-cream transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? text("contact.guestbook.busy") : text("contact.guestbook.sign")}
          </button>
          {msg && <span className="font-body text-xs text-ink-soft">{msg}</span>}
        </div>
      </form>

      <section id="guestbook-garden" className={layout.wall} aria-labelledby="guestbook-wall-title">
        <h2 id="guestbook-wall-title" className="font-serif text-2xl text-ink">{text("contact.garden.title")}</h2>
        <p className="mt-2 max-w-xl font-body text-sm text-ink-soft">{text("contact.garden.intro")}</p>
        {loadError && <p role="status" className="mt-4 font-body text-sm text-ink-soft">{text("contact.garden.error")}</p>}
        {entries === null && !loadError && <p className="mt-4 font-body text-sm text-ink-soft">{text("contact.guestbook.loading")}</p>}
        {entries !== null && <GuestbookGarden entries={entries} />}
      </section>
      </section>
    </div>
  );
}
