"use client";

import { useRouter } from "next/navigation";

export default function LockButton() {
  const router = useRouter();
  async function lock() {
    await fetch("/api/lock", { method: "POST" });
    router.refresh();
  }
  return (
    <button
      onClick={lock}
      className="rounded-full bg-white/70 px-4 py-1.5 font-body text-sm font-semibold text-ink-soft transition hover:bg-white"
    >
      🔒 lock the room again
    </button>
  );
}
