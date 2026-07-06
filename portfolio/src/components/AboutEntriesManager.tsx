"use client";

// Editable About-page entries (education / work / research), one section at a
// time. Loads the whole About record, shows just the requested section, and
// saves the full record so the other sections are preserved. Used in the
// atelier's work/education/research clusters.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InkEditor from "@/components/InkEditor";
import TagPicker from "@/components/TagPicker";
import { EditableText, adminApi } from "@/components/editing";
import { copyToHtml, detailsToHtml } from "@/lib/copyRender";
import { richToText } from "@/lib/richHtml";
import type { Entry } from "@/data/about";
import {
  categories as ALL_CATEGORIES,
  domains as ALL_DOMAINS,
  domainColor,
  type Domain,
} from "@/data/projects";

const isResearch = (e: Entry) => richToText(e.title).startsWith("Research Assistant");
const BLANK: Entry = { icon: "✨", when: "", title: "", place: "", note: "" };

const btn =
  "rounded-full px-4 py-1.5 font-body text-sm font-semibold transition disabled:opacity-50";
const btnDark = `${btn} bg-ink text-cream hover:opacity-90`;
const btnSoft = `${btn} bg-white/70 text-ink-soft hover:bg-white`;

function EntryEditor({
  entry,
  onChange,
  onRemove,
}: {
  entry: Entry;
  onChange: (e: Entry) => void;
  onRemove: () => void;
}) {
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
  section: "education" | "work" | "research";
}) {
  const api = adminApi(keyVal);
  const router = useRouter();
  const [education, setEducation] = useState<Entry[] | null>(null);
  const [work, setWork] = useState<Entry[]>([]);
  const [research, setResearch] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ education: Entry[]; timeline: Entry[] }>("/api/admin/about")
      .then((d) => {
        setEducation(d.education);
        setWork(d.timeline.filter((e) => !isResearch(e)));
        setResearch(d.timeline.filter(isResearch));
      })
      .catch(() => setMsg("couldn't load, refresh?"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = section === "education" ? education ?? [] : section === "work" ? work : research;
  const setList = section === "education" ? setEducation : section === "work" ? setWork : setResearch;

  async function save() {
    if (education === null) return;
    setSaving(true);
    setMsg("");
    try {
      await api("/api/admin/about", {
        method: "POST",
        body: JSON.stringify({ education, timeline: [...work, ...research] }),
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
    const d = await api<{ education: Entry[]; timeline: Entry[] }>("/api/admin/about");
    setEducation(d.education);
    setWork(d.timeline.filter((e) => !isResearch(e)));
    setResearch(d.timeline.filter(isResearch));
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
        <button className={btnSoft} onClick={() => (setList as (l: Entry[]) => void)([BLANK, ...list])}>
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
            key={i}
            entry={e}
            onChange={(ne) => (setList as (l: Entry[]) => void)(list.map((x, j) => (j === i ? ne : x)))}
            onRemove={() => (setList as (l: Entry[]) => void)(list.filter((_, j) => j !== i))}
          />
        ))}
      </div>
    </div>
  );
}
