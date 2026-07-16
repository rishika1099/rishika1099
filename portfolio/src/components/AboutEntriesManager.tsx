"use client";

// Editable About-page entries (education / work / research), one section at a
// time. Loads the whole About record, shows just the requested section, and
// saves the full record so the other sections are preserved. Used in the
// atelier's work/education/research clusters.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InkEditor from "@/components/InkEditor";
import PdfThumb from "@/components/PdfThumb";
import TagPicker from "@/components/TagPicker";
import { EditableText, adminApi } from "@/components/editing";
import { copyToHtml, detailsToHtml } from "@/lib/copyRender";
import { richToText } from "@/lib/richHtml";
import type { Attachment, Entry } from "@/data/about";
import {
  categories as ALL_CATEGORIES,
  domains as ALL_DOMAINS,
  domainColor,
  type Domain,
} from "@/data/projects";

const isResearch = (e: Entry) => richToText(e.title).startsWith("Research Assistant");
const BLANK: Entry = { icon: "✨", when: "", title: "", place: "", note: "" };

// stable per-row key so prepending a blank doesn't reuse an existing editor
type KEntry = Entry & { _k?: number };
let KSEQ = 1;
const keyed = (e: Entry): KEntry => ({ ...e, _k: KSEQ++ });

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const btn =
  "rounded-full px-4 py-1.5 font-body text-sm font-semibold transition disabled:opacity-50";
const btnDark = `${btn} bg-ink text-cream hover:opacity-90`;
const btnSoft = `${btn} bg-white/70 text-ink-soft hover:bg-white`;

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
    } else setAttMsg("upload failed (images or pdf, under 8MB)");
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
                    <img src={`/api/attachment/${a.id}`} alt={a.name} className="h-20 w-20 rounded-lg object-cover ring-1 ring-white/70" />
                  ) : (
                    <a
                      href={`/api/attachment/${a.id}`}
                      target="_blank"
                      rel="noreferrer"
                      title={a.name}
                      className="block h-20 w-20 overflow-hidden rounded-lg bg-white ring-1 ring-white/70"
                    >
                      <PdfThumb id={a.id} className="h-full w-full object-contain object-top" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onChange({ ...entry, attachments: attachments.filter((x) => x.id !== a.id) })}
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

export default function AboutEntriesManager({
  keyVal,
  section,
}: {
  keyVal: string;
  section: "education" | "work" | "research" | "certifications";
}) {
  const api = adminApi(keyVal);
  const router = useRouter();
  const [education, setEducation] = useState<KEntry[] | null>(null);
  const [work, setWork] = useState<KEntry[]>([]);
  const [research, setResearch] = useState<KEntry[]>([]);
  const [certifications, setCertifications] = useState<KEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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
    api<{ education: Entry[]; timeline: Entry[]; certifications?: Entry[] }>("/api/admin/about")
      .then((d) => {
        setEducation(d.education.map(keyed));
        setWork(d.timeline.filter((e) => !isResearch(e)).map(keyed));
        setResearch(d.timeline.filter(isResearch).map(keyed));
        setCertifications((d.certifications ?? []).map(keyed));
      })
      .catch(() => setMsg("couldn't load, refresh?"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list =
    section === "education"
      ? education ?? []
      : section === "work"
        ? work
        : section === "research"
          ? research
          : certifications;
  const setList =
    section === "education"
      ? setEducation
      : section === "work"
        ? setWork
        : section === "research"
          ? setResearch
          : setCertifications;

  async function save() {
    if (education === null) return;
    setSaving(true);
    setMsg("");
    try {
      // always send every section so none gets wiped
      await api("/api/admin/about", {
        method: "POST",
        body: JSON.stringify({ education, timeline: [...work, ...research], certifications }),
      });
      router.refresh();
      setMsg("saved ✓ live now");
    } catch {
      setMsg("save failed, every card needs a title");
    } finally {
      setSaving(false);
    }
  }

  async function revert() {
    if (!confirm(`Revert the About ${section} entries to the versions written in the code?`)) return;
    await api("/api/admin/about", { method: "DELETE" });
    const d = await api<{ education: Entry[]; timeline: Entry[]; certifications?: Entry[] }>("/api/admin/about");
    setEducation(d.education.map(keyed));
    setWork(d.timeline.filter((e) => !isResearch(e)).map(keyed));
    setResearch(d.timeline.filter(isResearch).map(keyed));
    setCertifications((d.certifications ?? []).map(keyed));
    setMsg("reverted ✓");
  }

  if (education === null)
    return <p className="mt-6 font-body text-sm text-ink-soft">opening the desk… ✦</p>;

  return (
    <div className="mt-4">
      <div className="sticky top-20 z-30 -mx-1 flex flex-wrap items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 shadow-sm backdrop-blur">
        <button className={btnDark} onClick={save} disabled={saving}>
          {saving ? "saving…" : "save"}
        </button>
        <button className={btnSoft} onClick={() => (setList as (l: KEntry[]) => void)([keyed(BLANK), ...list])}>
          ＋ add
        </button>
        <button className={btnSoft} onClick={revert}>revert to code</button>
        {msg && <span className="font-body text-xs text-ink-soft">{msg}</span>}
      </div>
      {section === "research" && (
        <p className="mt-2 font-body text-xs text-ink-soft/70">
          research cards keep a title starting with &quot;Research Assistant&quot; to stay in this section.
        </p>
      )}
      <div className="mt-4 space-y-4">
        {list.length === 0 && (
          <p className="font-body text-sm text-ink-soft">nothing here yet, add one ✦</p>
        )}
        {list.map((e, i) => (
          <EntryEditor
            key={e._k}
            entry={e}
            onChange={(ne) => (setList as (l: KEntry[]) => void)(list.map((x, j) => (j === i ? (ne as KEntry) : x)))}
            onRemove={() => (setList as (l: KEntry[]) => void)(list.filter((_, j) => j !== i))}
            onUpload={uploadAttachment}
          />
        ))}
      </div>
    </div>
  );
}
