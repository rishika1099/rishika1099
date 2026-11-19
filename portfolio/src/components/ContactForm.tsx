"use client";

import { useState } from "react";
import { m } from "framer-motion";
import AnimalVisitor from "./AnimalVisitor";
import { useFeatureCopy } from "./FeatureCopy";
import layout from "./ContactLayout.module.css";

const encode = (data: Record<string, string>) =>
  Object.keys(data)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
    .join("&");

const inputClass =
  "rounded-2xl border border-white/70 bg-white/80 px-4 py-2.5 font-body text-ink outline-none transition focus:border-blush focus:ring-2 focus:ring-blush/40";

const FORM_DEFAULTS = {
  "contact.form.title": "send me a message 💌",
  "contact.form.private": "📮 just between us · goes straight to my inbox, never shown here",
  "contact.form.placeholder.message": "say hi, share an idea, or a poem you loved…",
  "contact.form.send": "send ✦",
  "contact.form.sent": "thank you, your note is on its way ✦",
} as const;

export default function ContactForm({ copy }: { copy?: Record<string, string> }) {
  const text = useFeatureCopy();
  const t = (k: keyof typeof FORM_DEFAULTS) => copy?.[k]?.trim() || FORM_DEFAULTS[k];
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": "contact", "bot-field": "", ...form }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={layout.messageCard}
      >
        <div className="text-4xl">💌</div>
        <p className="mt-2 font-body text-lg font-semibold text-ink">{t("contact.form.sent")}</p>
        <p className="mt-1 font-body text-sm text-ink-soft">
          {text("contact.form.followup")}
        </p>
      </m.div>
    );
  }

  return (
    <m.form
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      onSubmit={submit}
      name="contact"
      className={layout.messageCard}
    >
      <input type="hidden" name="form-name" value="contact" />
      <p className="hidden">
        <label>
          leave this empty: <input name="bot-field" />
        </label>
      </p>

      <AnimalVisitor compact animal="cat">
      <h2 className="font-body text-xl font-bold text-ink">{t("contact.form.title")}</h2>
      <p className="mt-1 font-body text-sm text-ink-soft">{t("contact.form.private")}</p>
      </AnimalVisitor>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          name="name"
          required
          placeholder={text("contact.form.placeholder.name")}
          aria-label={text("contact.form.placeholder.name")}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputClass}
        />
        <input
          name="email"
          type="email"
          required
          placeholder={text("contact.form.placeholder.email")}
          aria-label={text("contact.form.placeholder.email")}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputClass}
        />
      </div>

      <textarea
        name="message"
        required
        rows={4}
        placeholder={t("contact.form.placeholder.message")}
        aria-label={t("contact.form.placeholder.message")}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className={`${inputClass} mt-3 w-full resize-none leading-relaxed`}
      />

      <div className="mt-4 text-center">
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-full bg-blush px-7 py-3 font-body font-semibold text-ink transition hover:scale-105 disabled:opacity-50"
        >
          {status === "sending" ? text("contact.form.sending") : t("contact.form.send")}
        </button>
        {status === "error" && (
          <p className="mt-2 font-body text-sm text-[#c0506b]">
            {text("contact.form.error")}
          </p>
        )}
      </div>
    </m.form>
  );
}
