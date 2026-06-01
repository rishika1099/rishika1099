"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const encode = (data: Record<string, string>) =>
  Object.keys(data)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
    .join("&");

const inputClass =
  "rounded-2xl border border-white/70 bg-white/80 px-4 py-2.5 font-body text-ink outline-none transition focus:border-blush focus:ring-2 focus:ring-blush/40";

export default function ContactForm() {
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-10 w-full max-w-xl rounded-3xl p-7 text-center soft-card"
      >
        <div className="text-4xl">💌</div>
        <p className="mt-2 font-body text-lg font-semibold text-ink">
          thank you, your note is on its way ✦
        </p>
        <p className="mt-1 font-body text-sm text-ink-soft">
          I&apos;ll get back to you soon.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      onSubmit={submit}
      name="contact"
      className="mt-10 w-full max-w-xl rounded-3xl p-6 text-left soft-card"
    >
      <input type="hidden" name="form-name" value="contact" />
      <p className="hidden">
        <label>
          leave this empty: <input name="bot-field" />
        </label>
      </p>

      <h2 className="text-center font-body text-xl font-bold text-ink">
        send me a message 💌
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          name="name"
          required
          placeholder="your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputClass}
        />
        <input
          name="email"
          type="email"
          required
          placeholder="your email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputClass}
        />
      </div>

      <textarea
        name="message"
        required
        rows={4}
        placeholder="say hi, share an idea, or a poem you loved…"
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
          {status === "sending" ? "sending…" : "send ✦"}
        </button>
        {status === "error" && (
          <p className="mt-2 font-body text-sm text-[#c0506b]">
            hmm, that didn&apos;t go through. try again, or email me directly?
          </p>
        )}
      </div>
    </motion.form>
  );
}
