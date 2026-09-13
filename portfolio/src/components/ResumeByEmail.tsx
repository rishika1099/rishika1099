"use client";

import { useRef, useState } from "react";

export interface ResumeEmailCopy {
  open: string;
  placeholder: string;
  anyRole: string;
  jd: string;
  send: string;
  sending: string;
  note: string;
  sent: string;
  badEmail: string;
  limit: string;
  error: string;
}

/**
 * "Email me the resume", for the recruiter who files things rather than reads
 * them on the spot.
 *
 * Folded to one line until asked for, so it does not crowd the question above
 * it. It opens already set to the role being viewed and holding whatever was
 * typed into the posting bar, since both are the answer to "which version", and
 * someone who has just told the page what they are hiring for should not have to
 * tell it again.
 */
export default function ResumeByEmail({
  role,
  roles,
  posting,
  copy,
}: {
  role: string | null;
  roles: { id: string; label: string }[];
  /** what is in the posting bar right now */
  posting: string;
  copy: ResumeEmailCopy;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [chosen, setChosen] = useState(role ?? "");
  const [jd, setJd] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "email" | "limit" | "error">("idle");
  const openedAt = useRef(0);

  // the same pale field the posting bar uses, so the form reads as part of it
  const field =
    "rounded-full border border-white/70 bg-white/80 px-4 py-2.5 font-body text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-[#a9a5e6] focus:ring-2 focus:ring-[#c2c0ef]/50";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          openedAt.current = Date.now();
          setChosen(role ?? "");
          setJd(posting);
          setOpen(true);
        }}
        className="font-body text-sm text-ink-soft underline decoration-[#a9a5e6] decoration-2 underline-offset-4 transition hover:text-ink"
      >
        {copy.open}
      </button>
    );
  }

  if (state === "sent") {
    return <p className="font-body text-sm font-semibold text-ink">{copy.sent}</p>;
  }

  const status =
    state === "email" ? copy.badEmail : state === "limit" ? copy.limit : state === "error" ? copy.error : copy.note;

  return (
    <form
      className="relative"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        try {
          const res = await fetch("/api/resume-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              role: chosen || null,
              jd,
              website: trap,
              elapsed: Date.now() - openedAt.current,
            }),
          });
          if (res.ok) return setState("sent");
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          setState(d.error === "email" ? "email" : d.error === "limit" ? "limit" : "error");
        } catch {
          setState("error");
        }
      }}
    >
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={copy.placeholder}
          aria-label={copy.placeholder}
          className={`min-w-[13rem] flex-1 ${field}`}
        />
        <select
          value={chosen}
          onChange={(e) => setChosen(e.target.value)}
          aria-label="role"
          className={`${field} pr-8`}
        >
          <option value="">{copy.anyRole}</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={state === "sending"}
          style={{ backgroundColor: "#c2c0ef" }}
          className="rounded-full px-5 py-2.5 font-body text-sm font-semibold text-ink ring-1 ring-white/70 transition hover:brightness-[0.97] disabled:opacity-60"
        >
          {state === "sending" ? copy.sending : copy.send}
        </button>
      </div>
      <textarea
        value={jd}
        onChange={(e) => setJd(e.target.value)}
        rows={2}
        maxLength={6000}
        placeholder={copy.jd}
        aria-label={copy.jd}
        className={`mt-2 w-full resize-y !rounded-2xl ${field}`}
      />
      {/* People never see this, so people never fill it in. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        name="website"
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />
      <p className="mt-2 font-body text-xs text-ink-soft/80">{status}</p>
    </form>
  );
}
