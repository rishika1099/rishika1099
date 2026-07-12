"use client";

// In-place editor for the About page: same layout and vibe as /about, but the
// bio and every card are editable boxes with a sticky save bar. Work and
// research live in their own sections, just like the real page.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import SkillGraph from "@/components/SkillGraph";
import InkEditor from "@/components/InkEditor";
import { copyToHtml, detailsToHtml } from "@/lib/copyRender";
import { richToText } from "@/lib/richHtml";
import { AdminGate, EditableText, SaveBar, adminApi } from "@/components/editing";
import { useFileSwap } from "@/components/FileSwap";
import type { Attachment, Entry } from "@/data/about";
import TagPicker from "@/components/TagPicker";
import { categories as ALL_CATEGORIES, domains as ALL_DOMAINS, domainColor, type Domain } from "@/data/projects";

const isResearch = (e: Entry) => richToText(e.title).startsWith("Research Assistant");

const BLANK: Entry = { icon: "✨", when: "", title: "", place: "", note: "" };

// The card editors (InkEditor) are uncontrolled: they read initialHtml once, on
// mount. Keying rows by index meant prepending a new blank reused an existing
// editor (showing the old entry). A stable per-row key fixes that: a new blank
// gets a fresh key, so React mounts a truly empty editor for it. The key rides
// on the object (preserved across edits via spread) and is stripped server-side.
type KEntry = Entry & { _k?: number };
let KSEQ = 1;
const keyed = (e: Entry): KEntry => ({ ...e, _k: KSEQ++ });

// editable copy on this page (title + section headings)
const ABOUT_COPY = [
  "about.title",
  "about.heading.education",
  "about.heading.skills",
  "about.heading.skills.sub",
  "about.heading.work",
  "about.heading.research",
  "about.heading.certifications",
] as const;

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(file);
  });

function EntryEditor({
  entry,
  onChange,
  onRemove,
  onUpload,
}: {
  entry: Entry;
  onChange: (e: Entry) => void;
  onRemove: () => void;
  onUpload: (file: File) => Promise<Attachment | null>;
}) {
  const [attMsg, setAttMsg] = useState("");
  const attachments = entry.attachments ?? [];

  async function addFile(file: File) {
    setAttMsg(`uploading ${file.name}…`);
    const meta = await onUpload(file);
    if (meta) {
      onChange({ ...entry, attachments: [...attachments, meta] });
      setAttMsg("");
    } else {
      setAttMsg("upload failed (images or pdf, under 8MB)");
    }
  }

  function removeFile(id: string) {
    onChange({ ...entry, attachments: attachments.filter((a) => a.id !== id) });
  }

  return (
    <div className="rounded-3xl p-5 soft-card">
      <div className="flex gap-4">
        <EditableText
          value={entry.icon}
          onChange={(v) => onChange({ ...entry, icon: v })}
          className="!w-14 shrink-0 text-center text-3xl"
        />
        <div className="flex-1 space-y-2">
          <InkEditor
            initialHtml={copyToHtml(entry.when)}
            onChange={(v) => onChange({ ...entry, when: v })}
            compact
            toolbarOnFocus
            surfaceClassName="font-body text-sm italic text-ink-soft"
            placeholder="when (e.g. Jan 2026 – Present)"
          />
          <InkEditor
            initialHtml={copyToHtml(entry.title)}
            onChange={(v) => onChange({ ...entry, title: v })}
            compact
            toolbarOnFocus
            surfaceClassName="font-body text-lg font-bold text-ink"
            placeholder="title"
          />
          <InkEditor
            initialHtml={copyToHtml(entry.place)}
            onChange={(v) => onChange({ ...entry, place: v })}
            compact
            toolbarOnFocus
            surfaceClassName="font-body text-sm font-semibold text-ink-soft"
            placeholder="place"
          />
          <InkEditor
            initialHtml={copyToHtml(entry.note)}
            onChange={(v) => onChange({ ...entry, note: v })}
            compact
            toolbarOnFocus
            surfaceClassName="font-body text-sm text-ink-soft"
            placeholder="a one-line description"
          />
          <p className="pt-1 font-body text-[11px] text-ink-soft/60">
            details (revealed when the card is tapped):
          </p>
          <InkEditor
            initialHtml={detailsToHtml(entry.details)}
            onChange={(v) => onChange({ ...entry, details: v })}
            compact
            toolbarOnFocus
            surfaceClassName="font-body text-sm text-ink-soft"
            placeholder="extra highlights, use the bullet-list button"
          />
          <p className="pt-1 font-body text-[11px] text-ink-soft/60">domain chips, tap what applies:</p>
          <TagPicker
            options={ALL_DOMAINS}
            value={entry.domains ?? []}
            onChange={(v) => onChange({ ...entry, domains: v as Entry["domains"] })}
            colorFor={(t) => domainColor[t as Domain]}
          />
          <p className="pt-1 font-body text-[11px] text-ink-soft/60">tech chips, tap what applies:</p>
          <TagPicker
            options={ALL_CATEGORIES}
            value={entry.tech ?? []}
            onChange={(v) => onChange({ ...entry, tech: v as Entry["tech"] })}
          />
          <p className="pt-1 font-body text-[11px] text-ink-soft/60">files (a certificate picture, a diploma PDF):</p>
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((a) => (
                <span key={a.id} className="relative inline-flex">
                  {a.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/attachment/${a.id}`}
                      alt={a.name}
                      className="h-20 w-20 rounded-lg object-cover ring-1 ring-white/70"
                    />
                  ) : (
                    <a
                      href={`/api/attachment/${a.id}`}
                      target="_blank"
                      rel="noreferrer"
                      title={a.name}
                      className="block h-20 w-20 overflow-hidden rounded-lg bg-white ring-1 ring-white/70"
                    >
                      <iframe
                        title={a.name}
                        src={`/api/attachment/${a.id}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        className="pointer-events-none border-0"
                        style={{ width: 264, height: 264, transform: "scale(0.303)", transformOrigin: "top left" }}
                        tabIndex={-1}
                      />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(a.id)}
                    aria-label={`remove ${a.name}`}
                    className="absolute -right-1.5 -top-1.5 h-5 w-5 rounded-full bg-rose/80 font-body text-[10px] font-bold text-ink shadow transition hover:bg-rose"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 font-body text-xs font-semibold text-ink-soft transition hover:bg-white">
            📎 attach a file
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addFile(f);
                e.target.value = "";
              }}
            />
          </label>
          {attMsg && <p className="font-body text-[11px] text-ink-soft/70">{attMsg}</p>}
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="remove entry"
          className="h-7 w-7 shrink-0 rounded-full bg-rose/50 font-body text-sm font-semibold text-ink transition hover:bg-rose/80"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function Editor({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const router = useRouter();
  const files = useFileSwap(keyVal);
  const [bio, setBio] = useState<string | null>(null);
  const [copy, setCopy] = useState<Record<string, string>>({});
  const [education, setEducation] = useState<KEntry[]>([]);
  const [work, setWork] = useState<KEntry[]>([]);
  const [research, setResearch] = useState<KEntry[]>([]);
  const [certifications, setCertifications] = useState<KEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // upload a picture/pdf, returns the attachment meta to pin on an entry
  async function uploadAttachment(file: File): Promise<Attachment | null> {
    try {
      const dataBase64 = await fileToBase64(file);
      return await api<Attachment>("/api/admin/attachments", {
        method: "POST",
        body: JSON.stringify({ name: file.name, mime: file.type, dataBase64 }),
      });
    } catch {
      return null;
    }
  }

  useEffect(() => {
    Promise.all([
      api<{ education: Entry[]; timeline: Entry[]; certifications?: Entry[] }>("/api/admin/about"),
      api<{ blocks: { id: string; text: string }[] }>("/api/admin/copy"),
    ])
      .then(([about, copy]) => {
        setEducation(about.education.map(keyed));
        setWork(about.timeline.filter((e) => !isResearch(e)).map(keyed));
        setResearch(about.timeline.filter(isResearch).map(keyed));
        setCertifications((about.certifications ?? []).map(keyed));
        setBio(copyToHtml(copy.blocks.find((b) => b.id === "about.bio")?.text ?? ""));
        const cm: Record<string, string> = {};
        for (const id of ABOUT_COPY) cm[id] = copy.blocks.find((b) => b.id === id)?.text ?? "";
        setCopy(cm);
      })
      .catch(() => setMsg("couldn't load, refresh?"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      await Promise.all([
        api("/api/admin/about", {
          method: "POST",
          body: JSON.stringify({ education, timeline: [...work, ...research], certifications }),
        }),
        api("/api/admin/copy", {
          method: "POST",
          body: JSON.stringify({ texts: { "about.bio": bio ?? "", ...copy } }),
        }),
      ]);
      // stay in edit mode; revalidate the live page in the background
      router.refresh();
      setMsg("saved ✓ live now");
    } catch {
      setMsg("save failed, every card needs a title");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setSaving(true);
    setMsg("");
    try {
      await Promise.all([
        api("/api/admin/about", {
          method: "POST",
          body: JSON.stringify({ education, timeline: [...work, ...research], certifications }),
        }),
        api("/api/admin/copy", {
          method: "POST",
          body: JSON.stringify({ texts: { "about.bio": bio ?? "", ...copy } }),
        }),
      ]);
      router.push("/about");
      router.refresh();
    } catch {
      setMsg("save failed, every card needs a title");
    } finally {
      setSaving(false);
    }
  }

  const COPY_IDS = ["about.bio", ...ABOUT_COPY];

  async function makeDefault() {
    if (!confirm('Make this page\'s current words the default? "Revert" will come back here.')) return;
    setSaving(true);
    setMsg("");
    try {
      await api("/api/admin/copy", {
        method: "POST",
        body: JSON.stringify({ texts: { "about.bio": bio ?? "", ...copy } }),
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
    if (!confirm("Revert this page to the default versions?")) return;
    await api("/api/admin/about", { method: "DELETE" });
    await api(`/api/admin/copy?ids=${encodeURIComponent(COPY_IDS.join(","))}`, { method: "DELETE" });
    const [about, copyRes] = await Promise.all([
      api<{ education: Entry[]; timeline: Entry[]; certifications?: Entry[] }>("/api/admin/about"),
      api<{ blocks: { id: string; text: string }[] }>("/api/admin/copy"),
    ]);
    setEducation(about.education.map(keyed));
    setWork(about.timeline.filter((e) => !isResearch(e)).map(keyed));
    setResearch(about.timeline.filter(isResearch).map(keyed));
    setCertifications((about.certifications ?? []).map(keyed));
    setBio(copyToHtml(copyRes.blocks.find((b) => b.id === "about.bio")?.text ?? ""));
    const cm: Record<string, string> = {};
    for (const id of ABOUT_COPY) cm[id] = copyRes.blocks.find((b) => b.id === id)?.text ?? "";
    setCopy(cm);
    setMsg("reverted to the default ✓");
  }

  if (bio === null)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;

  const cField = (id: string, className: string) => (
    <EditableText value={copy[id] ?? ""} onChange={(v) => setCopy((c) => ({ ...c, [id]: v }))} className={className} />
  );

  const section = (
    headingId: string,
    hint: string | null,
    list: KEntry[],
    set: (l: KEntry[]) => void,
  ) => (
    <>
      <div className="mt-12 flex items-center justify-between">
        <div className="flex-1">{cField(headingId, "font-body text-2xl font-bold text-ink")}</div>
        <button
          type="button"
          onClick={() => set([keyed(BLANK), ...list])}
          className="rounded-full bg-white/70 px-4 py-1.5 font-body text-sm font-semibold text-ink-soft transition hover:bg-white"
        >
          ＋ add
        </button>
      </div>
      {hint && <p className="mt-1 font-body text-xs text-ink-soft/70">{hint}</p>}
      <div className="mt-5 space-y-4">
        {list.map((e, i) => (
          <EntryEditor
            key={e._k}
            entry={e}
            onChange={(ne) => set(list.map((x, j) => (j === i ? (ne as KEntry) : x)))}
            onRemove={() => set(list.filter((_, j) => j !== i))}
            onUpload={uploadAttachment}
          />
        ))}
      </div>
    </>
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
      <InkEditor
        initialHtml={copyToHtml(copy["about.title"] ?? "")}
        onChange={(v) => setCopy((c) => ({ ...c, "about.title": v }))}
        compact
        toolbarOnFocus
        surfaceClassName="title-font text-3xl font-normal leading-tight text-shadow-soft text-ink sm:text-4xl"
        placeholder="page title"
      />

      <p className="mt-6 font-body text-xs text-ink-soft/70">
        bio, use the toolbar for headings, bold, fonts and colors:
      </p>
      <div className="mt-2 max-w-4xl">
        <InkEditor
          initialHtml={bio}
          onChange={setBio}
          surfaceClassName="font-body text-lg leading-relaxed text-ink-soft"
          placeholder="write your story…"
        />
      </div>

      <div className="mt-6 text-center">
        <span className="inline-flex items-center gap-1.5">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-blush/80 px-7 py-3 font-body text-lg font-semibold text-ink shadow-lg shadow-ink/20 transition hover:scale-105">
            📄 Replace Resume
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && files.upload("resume", e.target.files[0])}
            />
          </label>
          {files.has.resume && (
            <button
              type="button"
              title="back to the original resume"
              onClick={() => files.reset("resume")}
              className="rounded-full bg-white/75 px-3 py-3 font-body text-sm text-ink-soft shadow transition hover:bg-white"
            >
              ↺
            </button>
          )}
        </span>
        {files.msg && <p className="mt-1 font-body text-[11px] text-ink-soft/70">{files.msg}</p>}
      </div>

      {section("about.heading.education", null, education, setEducation)}

      <div className="mt-12">{cField("about.heading.skills", "font-body text-2xl font-bold text-ink")}</div>
      <div className="mt-1">{cField("about.heading.skills.sub", "font-body text-sm text-ink-soft")}</div>
      <p className="mt-1 font-body text-xs text-ink-soft/60">(the graph itself is tended in code)</p>
      <SkillGraph />

      {section("about.heading.work", null, work, setWork)}
      {section(
        "about.heading.research",
        'research cards keep a title starting with "Research Assistant" to stay in this section',
        research,
        setResearch,
      )}
      {section(
        "about.heading.certifications",
        "short courses, nanodegrees, certifications, attach the certificate as a picture or PDF",
        certifications,
        setCertifications,
      )}
    </>
  );
}

export default function AboutEdit() {
  return (
    <PageShell vibe="lilac">
      <AdminGate>{(key) => <Editor keyVal={key} />}</AdminGate>
    </PageShell>
  );
}
