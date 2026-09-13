"use client";

/**
 * "Send to inbox", beside the download links.
 *
 * The form itself lives under the role pills, where it can read the role being
 * viewed and whatever is in the posting bar. This is the way to it from where
 * someone looking for the PDF actually looks: it opens the form and brings it
 * into view.
 */
export const OPEN_RESUME_EMAIL = "resume-email:open";

export default function EmailResumeLink({ label, className = "" }: { label: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new Event(OPEN_RESUME_EMAIL));
        document.getElementById("email-resume")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
      className={`text-ink-soft underline decoration-[#a9a5e6] decoration-2 underline-offset-4 transition hover:text-ink ${className}`}
    >
      {label}
    </button>
  );
}
