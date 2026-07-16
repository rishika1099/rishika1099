"use client";

// Pick tags by tapping chips instead of typing them: shows every available
// tag, the ones that apply light up. With allowCustom, you can also type your
// own (reinforcement learning, robotics, …) and it's added as a chip.

import { useState } from "react";

export default function TagPicker({
  options,
  value,
  onChange,
  colorFor,
  allowCustom = false,
}: {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  /** selected-chip tint per tag (e.g. domainColor); defaults to mint */
  colorFor?: (t: string) => string | undefined;
  /** show a "+ add" input so custom tags beyond `options` can be created */
  allowCustom?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const toggle = (t: string) =>
    onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);

  // selected tags that aren't in the base list (ones you typed yourself)
  const custom = value.filter((v) => !options.includes(v));

  const addDraft = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
  };

  const chip = (t: string, on: boolean, isCustom = false) => {
    const tint = colorFor?.(t) ?? (isCustom ? "#e6d7f5" : "#bfe9d6");
    return (
      <button
        key={t}
        type="button"
        onClick={() => toggle(t)}
        aria-pressed={on}
        style={on ? { backgroundColor: tint } : undefined}
        className={`rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold transition ${
          on ? "text-ink ring-2 ring-ink/25" : "bg-white/60 text-ink-soft/70 hover:bg-white hover:text-ink"
        }`}
        title={isCustom ? "your own tag, click to remove" : undefined}
      >
        {on ? "✓ " : ""}
        {t}
        {isCustom && on ? " ✕" : ""}
      </button>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((t) => chip(t, value.includes(t)))}
      {custom.map((t) => chip(t, true, true))}
      {allowCustom && (
        <span className="inline-flex items-center gap-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDraft();
              }
            }}
            placeholder="+ add your own"
            className="w-28 rounded-full border border-dashed border-ink/25 bg-white/60 px-2.5 py-0.5 font-body text-[11px] text-ink outline-none placeholder:text-ink-soft/50 focus:border-blush focus:ring-1 focus:ring-blush/40"
          />
          {draft.trim() && (
            <button
              type="button"
              onClick={addDraft}
              className="rounded-full bg-ink px-2 py-0.5 font-body text-[11px] font-semibold text-cream transition hover:opacity-90"
            >
              ＋
            </button>
          )}
        </span>
      )}
    </div>
  );
}
