"use client";

import { useEffect, useRef, useState } from "react";
import { OPEN_RESUME_EMAIL } from "@/components/EmailResumeLink";

export interface ResumeEmailCopy {
  placeholder: string;
  send: string;
  sending: string;
  forPosting: string;
  /** "{role}" is replaced with the role's name */
  forRole: string;
  forAll: string;
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
 * Always open. Folded behind a line of text it was easy to miss, and an address
 * box is what says "you can have this emailed" at a glance.
 *
 * It asks for an address and nothing else. Which version to send is already
 * answered at the top of the page, by the role pill that is lit and whatever is
 * in the posting bar, so it sends that. The first version had its own role menu
 * and posting box, which asked the reader the page's question a second time.
 * One line under the address says which version is going, so nobody has to
 * guess what the page understood.
 */
export default function ResumeByEmail({
  role,
  roleLabel,
  posting,
  copy,
}: {
  role: string | null;
  roleLabel: string | null;
  /** what is in the posting bar right now; it wins over the role, as it does on the page */
  posting: string;
  copy: ResumeEmailCopy;
}) {
  const [email, setEmail] = useState("");
  const [trap, setTrap] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "email" | "limit" | "error">("idle");
  const openedAt = useRef(0);
  const emailBox = useRef<HTMLInputElement>(null);

  // The time on the form is counted from when the page arrived, since the box
  // is there from the start. The "send to inbox" links beside the downloads
  // bring it into view, and this puts the cursor in it once they have.
  useEffect(() => {
    openedAt.current = Date.now();
    const onOpen = () => setTimeout(() => emailBox.current?.focus({ preventScroll: true }), 450);
    window.addEventListener(OPEN_RESUME_EMAIL, onOpen);
    return () => window.removeEventListener(OPEN_RESUME_EMAIL, onOpen);
  }, []);

  const field =
    "rounded-full border border-white/70 bg-white/80 px-4 py-2.5 font-body text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-[#a9a5e6] focus:ring-2 focus:ring-[#c2c0ef]/50";

  if (state === "sent") {
    return <p className="font-body text-sm font-semibold text-ink">{copy.sent}</p>;
  }

  const version = posting
    ? copy.forPosting
    : roleLabel
      ? copy.forRole.replace("{role}", roleLabel)
      : copy.forAll;
  const status =
    state === "email" ? copy.badEmail : state === "limit" ? copy.limit : state === "error" ? copy.error : null;

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
              role,
              jd: posting,
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
      <div className="flex max-w-xl flex-wrap gap-2">
        <input
          ref={emailBox}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={copy.placeholder}
          aria-label={copy.placeholder}
          className={`min-w-[13rem] flex-1 ${field}`}
        />
        <button
          type="submit"
          disabled={state === "sending"}
          style={{ backgroundColor: "#c2c0ef" }}
          className="rounded-full px-5 py-2.5 font-body text-sm font-semibold text-ink ring-1 ring-white/70 transition hover:brightness-[0.97] disabled:opacity-60"
        >
          {state === "sending" ? copy.sending : copy.send}
        </button>
      </div>
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
      {/* which version is going, or what went wrong */}
      <p className="mt-2 font-body text-xs text-ink-soft">{status ?? version}</p>
      <p className="mt-0.5 font-body text-xs text-ink-soft/70">{copy.note}</p>
    </form>
  );
}
