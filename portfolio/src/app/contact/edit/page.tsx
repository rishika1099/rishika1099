"use client";

// In-place editor for the contact page: the intro writes in the ink editor
// (full width this time) and each contact card is editable where it stands,
// with add/remove for the cards themselves.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import PageShell from "@/components/PageShell";
import InkEditor from "@/components/InkEditor";
import { copyToHtml } from "@/lib/copyRender";
import { setEditMode } from "@/lib/editMode";
import { AdminGate, EditableText, SaveBar, adminApi } from "@/components/editing";
import GuestbookManager from "@/components/GuestbookManager";
import type { ContactLink } from "@/lib/contactLinks";

// the "send me a message" form's wording, edited in place here
const FORM_FIELDS: [id: string, label: string][] = [
  ["contact.form.title", "form heading"],
  ["contact.form.private", "privacy note"],
  ["contact.form.placeholder.message", "message box placeholder"],
  ["contact.form.send", "send button"],
  ["contact.form.sent", "sent confirmation"],
];

function Editor({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const router = useRouter();
  const [intro, setIntro] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [links, setLinks] = useState<ContactLink[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([
      api<{ blocks: { id: string; text: string }[] }>("/api/admin/copy"),
      api<{ links: ContactLink[] }>("/api/admin/contact"),
    ])
      .then(([copy, contact]) => {
        setIntro(copy.blocks.find((b) => b.id === "contact.intro")?.text ?? "");
        setTitle(copy.blocks.find((b) => b.id === "contact.title")?.text ?? "");
        const fm: Record<string, string> = {};
        for (const [id] of FORM_FIELDS) fm[id] = copy.blocks.find((b) => b.id === id)?.text ?? "";
        setForm(fm);
        setLinks(contact.links);
      })
      .catch(() => setMsg("couldn't load, refresh?"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      await Promise.all([
        api("/api/admin/copy", {
          method: "POST",
          body: JSON.stringify({ texts: { "contact.intro": intro ?? "", "contact.title": title, ...form } }),
        }),
        api("/api/admin/contact", { method: "POST", body: JSON.stringify({ links }) }),
      ]);
      // stay in edit mode; revalidate the live page in the background
      router.refresh();
      setMsg("saved ✓ live now");
    } catch {
      setMsg("save failed, every card needs a label and a link");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setSaving(true);
    setMsg("");
    try {
      await Promise.all([
        api("/api/admin/copy", {
          method: "POST",
          body: JSON.stringify({ texts: { "contact.intro": intro ?? "", "contact.title": title, ...form } }),
        }),
        api("/api/admin/contact", { method: "POST", body: JSON.stringify({ links }) }),
      ]);
      setEditMode(false);
      router.push("/contact");
      router.refresh();
    } catch {
      setMsg("save failed, every card needs a label and a link");
    } finally {
      setSaving(false);
    }
  }

  const COPY_IDS = ["contact.intro", "contact.title", ...FORM_FIELDS.map(([id]) => id)];

  async function makeDefault() {
    if (!confirm('Make this page\'s current words the default? "Revert" will come back here.')) return;
    setSaving(true);
    setMsg("");
    try {
      await api("/api/admin/copy", {
        method: "POST",
        body: JSON.stringify({ texts: { "contact.intro": intro ?? "", "contact.title": title, ...form } }),
      });
      await api("/api/admin/copy", {
        method: "POST",
        body: JSON.stringify({ promote: true, ids: COPY_IDS }),
      });
      setMsg("pinned as the default ✓");
    } catch {
      setMsg("couldn't pin, try again?");
    } finally {
      setSaving(false);
    }
  }

  async function revert() {
    if (!confirm("Revert the contact page to the default versions?")) return;
    await api("/api/admin/contact", { method: "DELETE" });
    await api(`/api/admin/copy?ids=${encodeURIComponent(COPY_IDS.join(","))}`, { method: "DELETE" });
    const [contact, copyRes] = await Promise.all([
      api<{ links: ContactLink[] }>("/api/admin/contact"),
      api<{ blocks: { id: string; text: string }[] }>("/api/admin/copy"),
    ]);
    setLinks(contact.links);
    setIntro(copyRes.blocks.find((b) => b.id === "contact.intro")?.text ?? "");
    setTitle(copyRes.blocks.find((b) => b.id === "contact.title")?.text ?? "");
    const fm: Record<string, string> = {};
    for (const [id] of FORM_FIELDS) fm[id] = copyRes.blocks.find((b) => b.id === id)?.text ?? "";
    setForm(fm);
    setMsg("reverted to the default ✓");
  }

  if (intro === null)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;

  const linkField = (i: number, key: keyof ContactLink, className: string) => (
    <EditableText
      value={links[i][key]}
      onChange={(v) => setLinks(links.map((l, j) => (j === i ? { ...l, [key]: v } : l)))}
      className={className}
    />
  );

  return (
    <>
      <SaveBar
        saving={saving}
        msg={msg}
        onSave={save}
        onPublish={publish}
        onMakeDefault={makeDefault}
        onRevert={revert}
      />
      <motion.span
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="text-6xl"
      >
        📮
      </motion.span>
      <div className="mx-auto mt-3 w-full max-w-xl">
        <InkEditor
          initialHtml={copyToHtml(title)}
          onChange={setTitle}
          compact
          toolbarOnFocus
          surfaceClassName="title-font text-3xl font-normal leading-tight text-shadow-soft text-ink sm:text-4xl"
          placeholder="page title"
        />
      </div>

      <div className="mt-3 w-full max-w-xl text-left">
        <InkEditor
          initialHtml={intro}
          onChange={setIntro}
          compact
          surfaceClassName="font-body text-lg text-ink-soft"
          placeholder="the line under the title…"
        />
      </div>

      <div className="mt-9 grid w-full max-w-xl gap-4 sm:grid-cols-2">
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
        <button
          type="button"
          onClick={() => setLinks([...links, { icon: "✨", label: "", value: "", href: "" }])}
          className="flex min-h-24 items-center justify-center rounded-3xl border-2 border-dashed border-ink/20 font-body text-sm font-semibold text-ink-soft transition hover:border-blush hover:text-ink"
        >
          ＋ add a card
        </button>
      </div>

      {/* the "send me a message" form: fields are fixed (it posts to Netlify
          forms), but every bit of its wording is editable here */}
      <div className="mt-10 w-full max-w-xl text-left">
        <h2 className="font-body text-lg font-bold text-ink">✉️ the message form</h2>
        <p className="mt-0.5 font-body text-xs text-ink-soft/70">
          the fields stay as-is (it posts to Netlify forms), but you can reword everything:
        </p>
        <div className="mt-3 space-y-3">
          {FORM_FIELDS.map(([id, label]) => (
            <div key={id} className="rounded-2xl bg-white/50 p-3">
              <p className="mb-1 font-body text-[11px] font-semibold text-ink-soft/70">{label}</p>
              <EditableText
                value={form[id] ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, [id]: v }))}
                className="font-body text-sm text-ink"
              />
            </div>
          ))}
        </div>
      </div>

      {/* guestbook moderation, right here in the contact edit room */}
      <div className="mt-10 w-full max-w-xl text-left">
        <h2 className="font-body text-lg font-bold text-ink">📖 guestbook</h2>
        <p className="mt-0.5 font-body text-xs text-ink-soft/70">
          hide or remove notes from the public wall. visitors only ever see the notes, never these controls.
        </p>
        <GuestbookManager keyVal={keyVal} />
      </div>
    </>
  );
}

export default function ContactEdit() {
  return (
    <PageShell vibe="rose" className="flex flex-col items-center text-center">
      <AdminGate>{(key) => <Editor keyVal={key} />}</AdminGate>
    </PageShell>
  );
}
