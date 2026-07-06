"use client";

// The ink editor: a little Medium-style writing surface for poems and blog
// posts. Select text, then pick one of the site's own fonts, a size, or a
// color from the palette. Output is HTML, sanitized again on the server.

import { useEffect, useRef, useState } from "react";

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
  toolbarOnFocus = false,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  compact?: boolean; // slimmer toolbar + surface for in-page passages
  surfaceClassName?: string; // typography matching the page being edited
  toolbarOnFocus?: boolean; // hide the toolbar until focused (many editors on one screen)
}) {
  const ref = useRef<HTMLDivElement>(null);
  // which toolbar dropdown (font/size/color/head/align) is open, if any
  const [menu, setMenu] = useState<string | null>(null);

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

  // small dropdown helpers so the toolbar stays compact (font/size/color/…)
  const menuWrap =
    "absolute left-0 top-full z-20 mt-1 flex max-w-[15rem] flex-wrap gap-1 rounded-2xl border border-ink/10 bg-white p-2 shadow-lg";
  const menuItem = "w-full rounded-lg px-2 py-1 text-left font-body text-xs text-ink hover:bg-blush/20";
  const toggle = (m: string) => setMenu((cur) => (cur === m ? null : m));
  const drop = (id: string, label: React.ReactNode, title: string, body: React.ReactNode) => (
    <div className="relative">
      <button type="button" title={title} onClick={() => toggle(id)} className={tbBtn}>
        {label} ▾
      </button>
      {menu === id && <div className={menuWrap}>{body}</div>}
    </div>
  );

  return (
    <div className="group rounded-3xl border border-white/70 bg-white/70 shadow-sm backdrop-blur transition focus-within:border-blush focus-within:ring-2 focus-within:ring-blush/50">
      <div
        onMouseDown={keepSel}
        className={`${
          toolbarOnFocus ? "hidden group-focus-within:flex" : "flex"
        } flex-wrap items-center gap-1.5 rounded-t-3xl border-b border-ink/10 bg-white/60 px-3 py-2`}
      >
        <button type="button" title="undo (⌘Z)" onClick={() => cmd("undo")} className={tbBtn}>↺</button>
        <button type="button" title="redo (⌘⇧Z)" onClick={() => cmd("redo")} className={tbBtn}>↻</button>
        <span className="mx-0.5 h-4 w-px bg-ink/15" />

        {/* font */}
        {drop(
          "font",
          "font",
          "font",
          FONTS.map(([label, family]) => (
            <button
              key={label}
              type="button"
              onClick={() => { wrapSelection({ "font-family": family }); setMenu(null); }}
              className={menuItem}
              style={{ fontFamily: family }}
            >
              {label}
            </button>
          )),
        )}

        {/* size */}
        {drop(
          "size",
          "size",
          "text size",
          SIZES.map(([label, px]) => (
            <button key={label} type="button" onClick={() => { wrapSelection({ "font-size": px }); setMenu(null); }} className={menuItem}>
              {label} · {px}
            </button>
          )),
        )}

        {/* color: text + highlight */}
        {drop(
          "color",
          "🎨",
          "text & highlight colour",
          <>
            <p className="w-full font-body text-[10px] font-bold uppercase tracking-wide text-ink-soft/70">text</p>
            <div className="flex w-full flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button key={`t${c}`} type="button" aria-label={`text ${c}`} onClick={() => { wrapSelection({ color: c }); setMenu(null); }} className="h-5 w-5 rounded-full ring-1 ring-ink/20 transition hover:scale-110" style={{ backgroundColor: c }} />
              ))}
            </div>
            <p className="mt-1 w-full font-body text-[10px] font-bold uppercase tracking-wide text-ink-soft/70">highlight</p>
            <div className="flex w-full flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button key={`h${c}`} type="button" aria-label={`highlight ${c}`} onClick={() => { wrapSelection({ "background-color": c }); setMenu(null); }} className="h-5 w-5 rounded-md ring-1 ring-ink/20 transition hover:scale-110" style={{ backgroundColor: c }} />
              ))}
            </div>
          </>,
        )}
        <span className="mx-0.5 h-4 w-px bg-ink/15" />

        {/* inline emphasis */}
        <button type="button" title="bold (⌘B)" onClick={() => cmd("bold")} className={`${tbBtn} font-extrabold`}>B</button>
        <button type="button" title="italic (⌘I)" onClick={() => cmd("italic")} className={`${tbBtn} italic`}>I</button>
        <button type="button" title="underline (⌘U)" onClick={() => cmd("underline")} className={`${tbBtn} underline`}>U</button>
        <button type="button" title="strikethrough" onClick={() => cmd("strikeThrough")} className={`${tbBtn} line-through`}>S</button>
        <span className="mx-0.5 h-4 w-px bg-ink/15" />

        {/* headings / block style */}
        {drop(
          "head",
          "H",
          "heading / paragraph",
          <>
            <button type="button" onClick={() => { cmd("formatBlock", "H1"); setMenu(null); }} className={`${menuItem} text-lg font-bold`}>H1 · big</button>
            <button type="button" onClick={() => { cmd("formatBlock", "H2"); setMenu(null); }} className={`${menuItem} text-base font-bold`}>H2 · medium</button>
            <button type="button" onClick={() => { cmd("formatBlock", "H3"); setMenu(null); }} className={`${menuItem} text-sm font-bold`}>H3 · small</button>
            <button type="button" onClick={() => { cmd("formatBlock", "BLOCKQUOTE"); setMenu(null); }} className={menuItem}>❝ quote</button>
            <button type="button" onClick={() => { cmd("formatBlock", "P"); setMenu(null); }} className={menuItem}>¶ paragraph</button>
          </>,
        )}

        {/* lists */}
        <button type="button" title="bullet list" onClick={() => cmd("insertUnorderedList")} className={tbBtn}>••</button>
        <button type="button" title="numbered list" onClick={() => cmd("insertOrderedList")} className={tbBtn}>1.</button>

        {/* alignment */}
        {drop(
          "align",
          "≡",
          "text alignment",
          <>
            <button type="button" onClick={() => { cmd("justifyLeft"); setMenu(null); }} className={menuItem}>⇤ left</button>
            <button type="button" onClick={() => { cmd("justifyCenter"); setMenu(null); }} className={menuItem}>↔ center</button>
            <button type="button" onClick={() => { cmd("justifyRight"); setMenu(null); }} className={menuItem}>⇥ right</button>
            <button type="button" onClick={() => { cmd("justifyFull"); setMenu(null); }} className={menuItem}>≣ justify</button>
          </>,
        )}
        <span className="mx-0.5 h-4 w-px bg-ink/15" />

        {/* code, link, clear */}
        <button type="button" title="inline code" onClick={() => wrapSelection({}, "code")} className={`${tbBtn} font-mono`}>{"<>"}</button>
        <button type="button" title="code block" onClick={() => cmd("formatBlock", "PRE")} className={`${tbBtn} font-mono`}>{"{ }"}</button>
        <button type="button" title="add a link" onClick={link} className={tbBtn}>🔗</button>
        <button type="button" title="clear formatting" onClick={() => cmd("removeFormat")} className={tbBtn}>⌫</button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onMouseDown={() => setMenu(null)}
        data-placeholder={placeholder}
        style={{ minHeight: compact ? "3.5rem" : minHeight }}
        className={`ink-editor-surface rounded-b-3xl outline-none ${compact ? "px-3 py-2" : "px-5 py-4"} ${surfaceClassName}`}
      />
    </div>
  );
}
