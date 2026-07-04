"use client";

// Pick tags by tapping chips instead of typing them: shows every available
// tag, the ones that apply light up. Used wherever tags are edited.

export default function TagPicker({
  options,
  value,
  onChange,
  colorFor,
}: {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  /** selected-chip tint per tag (e.g. domainColor); defaults to mint */
  colorFor?: (t: string) => string | undefined;
}) {
  const toggle = (t: string) =>
    onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((t) => {
        const on = value.includes(t);
        const tint = colorFor?.(t) ?? "#bfe9d6";
        return (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            aria-pressed={on}
            style={on ? { backgroundColor: tint } : undefined}
            className={`rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold transition ${
              on
                ? "text-ink ring-2 ring-ink/25"
                : "bg-white/60 text-ink-soft/70 hover:bg-white hover:text-ink"
            }`}
          >
            {on ? "✓ " : ""}
            {t}
          </button>
        );
      })}
    </div>
  );
}
