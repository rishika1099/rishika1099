"use client";

// The ink editor: a little Medium-style writing surface for poems and blog
// posts. Select text, then pick one of the site's own fonts, a size, or a
// color from the palette. Output is HTML, sanitized again on the server.

import { useEffect, useRef } from "react";

const FONTS: [string, string][] = [
  ["body", "var(--font-nunito)"],
  ["serif", "var(--font-cormorant)"],
  ["hand", "var(--font-caveat)"],
  ["bubbly", "var(--font-cattalague)"],
  ["whimsy", "var(--font-halimun)"],
];

const SIZES: [string, string][] = [
  ["S", "14px"],
  ["M", "18px"],
  ["L", "24px"],
  ["XL", "32px"],
];

const COLORS = [
  "#4a4a5e", // ink
  "#6f6f86", // ink soft
  "#c77dba", // orchid
  "#8e7bd6", // violet
  "#6aa6d6", // sky
  "#2f8f74", // deep mint
  "#e0708f", // rose
  "#c98f2d", // gold
  "#fff8f0", // cream (for the dark poem room)
];

const tbBtn =
  "rounded-full bg-white/80 px-2.5 py-1 font-body text-xs font-semibold text-ink transition hover:bg-white";

export default function InkEditor({
  initialHtml,
  onChange,
  placeholder = "start writing…",
  minHeight = "16rem",
  compact = false,
  surfaceClassName = "font-body text-base leading-relaxed text-ink",
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  compact?: boolean; // slimmer toolbar + surface for in-page passages
  surfaceClassName?: string; // typography matching the page being edited
}) {
  const ref = useRef<HTMLDivElement>(null);

  // uncontrolled surface: set the initial HTML once, then the DOM is truth
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== initialHtml) {
      ref.current.innerHTML = initialHtml;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => onChange(ref.current?.innerHTML ?? "");

  // wrap the current selection in a styled element (works across most selections)
  function wrapSelection(styles: Record<string, string>, tag = "span") {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    if (!ref.current?.contains(sel.anchorNode)) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement(tag);
    for (const [k, v] of Object.entries(styles)) span.style.setProperty(k, v);
    try {
      range.surroundContents(span);
    } catch {
      // selection crosses element boundaries: extract and rewrap
      span.appendChild(range.extractContents());
      range.insertNode(span);
    }
    sel.removeAllRanges();
    const r = document.createRange();
    r.selectNodeContents(span);
    sel.addRange(r);
    emit();
  }

  function cmd(name: string, value?: string) {
    document.execCommand(name, false, value);
    emit();
  }

  function link() {
    const url = prompt("link to… (https://)");
    if (!url) return;
    if (!/^https?:\/\/|^mailto:|^\//i.test(url)) return alert("links must start with https://, mailto: or /");
    document.execCommand("createLink", false, url);
    emit();
  }

  // keep the selection alive while clicking toolbar buttons
  const keepSel = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="rounded-3xl border border-white/70 bg-white/70 shadow-sm backdrop-blur transition focus-within:border-blush focus-within:ring-2 focus-within:ring-blush/50">
      <div
        onMouseDown={keepSel}
        className="flex flex-wrap items-center gap-1.5 rounded-t-3xl border-b border-ink/10 bg-white/60 px-3 py-2"
      >
        <button type="button" title="undo" onClick={() => cmd("undo")} className={tbBtn}>
          ↺
        </button>
        <button type="button" title="redo" onClick={() => cmd("redo")} className={tbBtn}>
          ↻
        </button>
        <span className="mx-1 h-4 w-px bg-ink/15" />
        <span className="mr-1 font-body text-[10px] font-bold uppercase tracking-wide text-ink-soft/70">
          font
        </span>
        {FONTS.map(([label, family]) => (
          <button
            key={label}
            type="button"
            onClick={() => wrapSelection({ "font-family": family })}
            className={tbBtn}
            style={{ fontFamily: family }}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-ink/15" />
        <span className="mr-1 font-body text-[10px] font-bold uppercase tracking-wide text-ink-soft/70">
          size
        </span>
        {SIZES.map(([label, px]) => (
          <button
            key={label}
            type="button"
            onClick={() => wrapSelection({ "font-size": px })}
            className={tbBtn}
          >
            {label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-ink/15" />
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`color ${c}`}
            onClick={() => wrapSelection({ color: c })}
            className="h-5 w-5 rounded-full ring-1 ring-ink/20 transition hover:scale-110"
            style={{ backgroundColor: c }}
          />
        ))}
        <span className="mx-1 h-4 w-px bg-ink/15" />
        <button type="button" onClick={() => cmd("bold")} className={`${tbBtn} font-extrabold`}>
          B
        </button>
        <button type="button" onClick={() => cmd("italic")} className={`${tbBtn} italic`}>
          I
        </button>
        <span className="mx-1 h-4 w-px bg-ink/15" />
        <button type="button" title="heading" onClick={() => cmd("formatBlock", "H2")} className={tbBtn}>
          H
        </button>
        <button type="button" title="quote" onClick={() => cmd("formatBlock", "BLOCKQUOTE")} className={tbBtn}>
          ❝
        </button>
        <button type="button" title="inline code" onClick={() => wrapSelection({}, "code")} className={`${tbBtn} font-mono`}>
          {"<>"}
        </button>
        <button type="button" title="code block" onClick={() => cmd("formatBlock", "PRE")} className={`${tbBtn} font-mono`}>
          {"{ }"}
        </button>
        <button type="button" title="bullet list" onClick={() => cmd("insertUnorderedList")} className={tbBtn}>
          ••
        </button>
        <button type="button" title="link" onClick={link} className={tbBtn}>
          🔗
        </button>
        <button type="button" title="back to a plain paragraph" onClick={() => cmd("formatBlock", "P")} className={tbBtn}>
          ¶
        </button>
        <button type="button" onClick={() => cmd("removeFormat")} className={tbBtn}>
          ⌫ plain
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        data-placeholder={placeholder}
        style={{ minHeight: compact ? "3.5rem" : minHeight }}
        className={`ink-editor-surface rounded-b-3xl outline-none ${compact ? "px-3 py-2" : "px-5 py-4"} ${surfaceClassName}`}
      />
    </div>
  );
}
