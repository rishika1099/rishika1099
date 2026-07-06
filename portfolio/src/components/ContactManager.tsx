"use client";

// The Contact cluster: edit the contact cards (icon/label/value/link), plus
// swap the resume PDF and the portrait photo. Used in the atelier.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditableText, adminApi } from "@/components/editing";
import { useFileSwap } from "@/components/FileSwap";
import type { ContactLink } from "@/lib/contactLinks";

const btn =
  "rounded-full px-4 py-1.5 font-body text-sm font-semibold transition disabled:opacity-50";
const btnDark = `${btn} bg-ink text-cream hover:opacity-90`;
const btnSoft = `${btn} bg-white/70 text-ink-soft hover:bg-white`;

export default function ContactManager({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const router = useRouter();
  const files = useFileSwap(keyVal);
  const [links, setLinks] = useState<ContactLink[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ links: ContactLink[] }>("/api/admin/contact")
      .then((d) => setLinks(d.links))
      .catch(() => setMsg("couldn't load, refresh?"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!links) return;
    setSaving(true);
    setMsg("");
    try {
      await api("/api/admin/contact", { method: "POST", body: JSON.stringify({ links }) });
      router.refresh();
      setMsg("saved ✓ live now");
    } catch {
      setMsg("save failed, every card needs a label and a link");
    } finally {
      setSaving(false);
    }
  }

  async function revert() {
    if (!confirm("Revert the contact cards to the versions written in the code?")) return;
    await api("/api/admin/contact", { method: "DELETE" });
    const d = await api<{ links: ContactLink[] }>("/api/admin/contact");
    setLinks(d.links);
    setMsg("cards reverted ✓");
  }

  if (!links) return <p className="mt-6 font-body text-sm text-ink-soft">opening the desk… ✦</p>;

  const linkField = (i: number, key: keyof ContactLink, className: string) => (
    <EditableText
      value={links[i][key]}
      onChange={(v) => setLinks(links.map((l, j) => (j === i ? { ...l, [key]: v } : l)))}
      className={className}
    />
  );

  return (
    <div className="mt-4">
      {(msg || files.msg) && (
        <p className="font-body text-sm text-ink-soft">{msg || files.msg}</p>
      )}

      {/* resume + portrait swaps */}
      <div className="mt-2 flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/75 px-4 py-1.5 font-body text-sm font-semibold text-ink shadow-sm transition hover:bg-white">
            📄 replace resume
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && files.upload("resume", e.target.files[0])}
            />
          </label>
          {files.has.resume && (
            <button className={btnSoft} onClick={() => files.reset("resume")} title="back to the original resume">
              ↺
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white/75 px-4 py-1.5 font-body text-sm font-semibold text-ink shadow-sm transition hover:bg-white">
            🖼️ replace photo
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && files.upload("portrait", e.target.files[0])}
            />
          </label>
          {files.has.portrait && (
            <button className={btnSoft} onClick={() => files.reset("portrait")} title="back to the GitHub photo">
              ↺
            </button>
          )}
        </div>
      </div>

      <div className="sticky top-20 z-30 -mx-1 mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
        <button className={btnDark} onClick={save} disabled={saving}>
          {saving ? "saving…" : "save cards"}
        </button>
        <button
          className={btnSoft}
          onClick={() => setLinks([...links, { icon: "✨", label: "", value: "", href: "" }])}
        >
          ＋ add a card
        </button>
        <button className={btnSoft} onClick={revert}>revert cards</button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {links.map((l, i) => (
          <div key={i} className="relative flex items-start gap-3 rounded-3xl p-5 text-left soft-card">
            <div className="w-12 shrink-0">{linkField(i, "icon", "text-center text-2xl")}</div>
            <div className="min-w-0 flex-1 space-y-1">
              {linkField(i, "label", "font-display text-sm font-semibold text-ink")}
              {linkField(i, "value", "font-body text-xs text-ink-soft")}
              {linkField(i, "href", "font-body text-[10px] text-ink-soft/70")}
            </div>
            <button
              type="button"
              onClick={() => setLinks(links.filter((_, j) => j !== i))}
              aria-label="remove card"
              className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-rose/70 font-body text-xs font-semibold text-ink shadow-sm transition hover:bg-rose"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
