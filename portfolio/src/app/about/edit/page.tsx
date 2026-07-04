"use client";

// In-place editor for the About page: same layout and vibe as /about, but the
// bio and every card are editable boxes with a sticky save bar. Work and
// research live in their own sections, just like the real page.

import { useEffect, useState } from "react";
import PageShell from "@/components/PageShell";
import PageTitle from "@/components/PageTitle";
import { AdminGate, EditableText, SaveBar, adminApi } from "@/components/editing";
import { copyDefaults } from "@/data/copy";
import type { Entry } from "@/data/about";

const isResearch = (e: Entry) => e.title.startsWith("Research Assistant");

const BLANK: Entry = { icon: "✨", when: "", title: "", place: "", note: "" };

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
        <div className="flex-1 space-y-1.5">
          <EditableText
            value={entry.when}
            onChange={(v) => onChange({ ...entry, when: v })}
            className="font-body text-sm italic text-ink-soft"
          />
          <EditableText
            value={entry.title}
            onChange={(v) => onChange({ ...entry, title: v })}
            className="font-body text-lg font-bold text-ink"
          />
          <EditableText
            value={entry.place}
            onChange={(v) => onChange({ ...entry, place: v })}
            className="font-body text-sm font-semibold text-ink-soft"
          />
          <EditableText
            value={entry.note}
            onChange={(v) => onChange({ ...entry, note: v })}
            className="font-body text-sm text-ink-soft"
          />
          <p className="pt-1 font-body text-[11px] text-ink-soft/60">
            details, one per line (**text** = bold):
          </p>
          <EditableText
            value={(entry.details ?? []).join("\n")}
            onChange={(v) => onChange({ ...entry, details: v.split("\n") })}
            className="font-body text-sm text-ink-soft"
          />
          <div className="flex flex-wrap gap-2 pt-1">
            <EditableText
              value={(entry.domains ?? []).join(", ")}
              onChange={(v) =>
                onChange({ ...entry, domains: v.split(",").map((s) => s.trim()) as Entry["domains"] })
              }
              className="!w-64 font-body text-[11px] font-semibold text-ink"
            />
            <EditableText
              value={(entry.tech ?? []).join(", ")}
              onChange={(v) =>
                onChange({ ...entry, tech: v.split(",").map((s) => s.trim()) as Entry["tech"] })
              }
              className="!w-64 font-body text-[11px] font-semibold text-ink-soft"
            />
          </div>
          <p className="font-body text-[11px] text-ink-soft/60">
            ↑ domain chips (colored) and tech chips (mint), comma-separated
          </p>
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
  const [bio, setBio] = useState<string | null>(null);
  const [education, setEducation] = useState<Entry[]>([]);
  const [work, setWork] = useState<Entry[]>([]);
  const [research, setResearch] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([
      api<{ education: Entry[]; timeline: Entry[] }>("/api/admin/about"),
      api<{ blocks: { id: string; text: string }[] }>("/api/admin/copy"),
    ])
      .then(([about, copy]) => {
        setEducation(about.education);
        setWork(about.timeline.filter((e) => !isResearch(e)));
        setResearch(about.timeline.filter(isResearch));
        setBio(copy.blocks.find((b) => b.id === "about.bio")?.text ?? "");
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
          body: JSON.stringify({ education, timeline: [...work, ...research] }),
        }),
        api("/api/admin/copy", {
          method: "POST",
          body: JSON.stringify({ texts: { "about.bio": bio ?? "" } }),
        }),
      ]);
      setMsg("saved ✓ live now");
    } catch {
      setMsg("save failed, every card needs a title");
    } finally {
      setSaving(false);
    }
  }

  async function revert() {
    if (!confirm("Revert this page to the versions written in the code?")) return;
    await api("/api/admin/about", { method: "DELETE" });
    const d = await api<{ education: Entry[]; timeline: Entry[] }>("/api/admin/about");
    setEducation(d.education);
    setWork(d.timeline.filter((e) => !isResearch(e)));
    setResearch(d.timeline.filter(isResearch));
    const defaultBio = copyDefaults["about.bio"].text;
    setBio(defaultBio);
    await api("/api/admin/copy", {
      method: "POST",
      body: JSON.stringify({ texts: { "about.bio": defaultBio } }),
    });
    setMsg("reverted ✓");
  }

  if (bio === null)
    return <p className="mt-8 text-center font-body text-sm text-ink-soft">unlocking the page… ✦</p>;

  const section = (
    heading: string,
    hint: string | null,
    list: Entry[],
    set: (l: Entry[]) => void,
  ) => (
    <>
      <div className="mt-12 flex items-center justify-between">
        <h2 className="font-body text-2xl font-bold text-ink">{heading}</h2>
        <button
          type="button"
          onClick={() => set([BLANK, ...list])}
          className="rounded-full bg-white/70 px-4 py-1.5 font-body text-sm font-semibold text-ink-soft transition hover:bg-white"
        >
          ＋ add
        </button>
      </div>
      {hint && <p className="mt-1 font-body text-xs text-ink-soft/70">{hint}</p>}
      <div className="mt-5 space-y-4">
        {list.map((e, i) => (
          <EntryEditor
            key={i}
            entry={e}
            onChange={(ne) => set(list.map((x, j) => (j === i ? ne : x)))}
            onRemove={() => set(list.filter((_, j) => j !== i))}
          />
        ))}
      </div>
    </>
  );

  return (
    <>
      <SaveBar saving={saving} msg={msg} onSave={save} onRevert={revert} viewHref="/about" />
      <PageTitle>the human behind the models 🦦</PageTitle>

      <p className="mt-6 font-body text-xs text-ink-soft/70">
        bio, a blank line starts a new paragraph and **text** renders bold:
      </p>
      <div className="mt-2 max-w-4xl">
        <EditableText
          value={bio}
          onChange={setBio}
          className="font-body text-lg leading-relaxed text-ink-soft"
        />
      </div>

      {section("where curiosity took me 🎓", null, education, setEducation)}
      {section("where curiosity paid the bills 💼", null, work, setWork)}
      {section(
        "where curiosity became research 🔬",
        'research cards keep a title starting with "Research Assistant" to stay in this section',
        research,
        setResearch,
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
