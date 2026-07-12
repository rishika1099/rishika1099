"use client";

// The ink editor: a little Medium-style writing surface for poems and blog
// posts. Select text, then pick one of the site's own fonts, a size, or a
// color from the palette. Output is HTML, sanitized again on the server.

import { useEffect, useRef, useState } from "react";
import RephrasePanel from "@/components/RephrasePanel";

const FONTS: [string, string][] = [
  ["body", "var(--font-nunito)"],
  ["serif", "var(--font-cormorant)"],
  ["hand", "var(--font-caveat)"],
  ["bubbly", "var(--font-cattalague)"],
  ["whimsy", "var(--font-halimun)"],
];

// a second sector of fonts in the font menu
const FONTS_MORE: [string, string][] = [
  ["elegant", "var(--font-playfair)"],
  ["script", "var(--font-dancing)"],
  ["retro", "var(--font-pacifico)"],
  ["round", "var(--font-quicksand)"],
  ["mono", "var(--font-space-mono)"],
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

export default function InkEditor({
  initialHtml,
  onChange,
  placeholder = "start writing…",
  minHeight = "16rem",
  compact = false,
  surfaceClassName = "font-body text-base leading-relaxed text-ink",
  toolbarOnFocus = false,
  dark = false,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  compact?: boolean; // slimmer toolbar + surface for in-page passages
  surfaceClassName?: string; // typography matching the page being edited
  toolbarOnFocus?: boolean; // hide the toolbar until focused (many editors on one screen)
  dark?: boolean; // dark surface (the poem room) so writing is WYSIWYG
}) {
  // themed toolbar so a dark editor (poems) reads correctly on its own bg
  const tbBtn = dark
    ? "rounded-full bg-white/15 px-2.5 py-1 font-body text-xs font-semibold text-cream transition hover:bg-white/25"
    : "rounded-full bg-white/80 px-2.5 py-1 font-body text-xs font-semibold text-ink transition hover:bg-white";
  const sep = dark ? "mx-0.5 h-4 w-px bg-white/20" : "mx-0.5 h-4 w-px bg-ink/15";
  const ref = useRef<HTMLDivElement>(null);
  // which toolbar dropdown (font/size/color/head/align) is open, if any
  const [menu, setMenu] = useState<string | null>(null);
  // format-painter: styles captured from a selection, to paint onto the next one
  const [painter, setPainter] = useState<Record<string, string> | null>(null);
  // ✨ rephrase: the selected text handed to the private assistant panel
  const [rephraseText, setRephraseText] = useState("");
  // the selected text's current font size in px (shown in the size stepper)
  const [curSize, setCurSize] = useState<number | null>(null);
  // last non-collapsed selection inside the editor, so a native colour picker
  // or input that steals focus can't lose the user's selection
  const lastRange = useRef<Range | null>(null);

  // uncontrolled surface: set the initial HTML once, then the DOM is truth
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== initialHtml) {
      ref.current.innerHTML = initialHtml;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // remember the live selection + track the selected text's font size (for the
  // size stepper) whenever the selection is a real range inside the editor
  useEffect(() => {
    const onSel = () => {
      const s = window.getSelection();
      if (s && s.rangeCount && !s.isCollapsed && ref.current?.contains(s.anchorNode)) {
        lastRange.current = s.getRangeAt(0).cloneRange();
        const node = s.anchorNode;
        const el = (node?.nodeType === 3 ? node.parentElement : (node as Element | null)) ?? null;
        if (el) setCurSize(Math.round(parseFloat(getComputedStyle(el).fontSize)) || null);
      }
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  const emit = () => onChange(ref.current?.innerHTML ?? "");

  // make sure there's a usable selection (restore the remembered one if focus moved)
  function ensureSelection(): boolean {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && !sel.isCollapsed && ref.current?.contains(sel.anchorNode)) return true;
    if (sel && lastRange.current) {
      sel.removeAllRanges();
      sel.addRange(lastRange.current);
      return true;
    }
    return false;
  }

  // wrap the current selection in a styled element (works across most selections)
  function wrapSelection(styles: Record<string, string>, tag = "span") {
    if (!ensureSelection()) return;
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

  // "make it plain": strip inline styles AND any list / heading / quote wrapper
  // (removeFormat alone leaves bullets and headings in place)
  function clearBlock() {
    try {
      document.execCommand("removeFormat");
      if (document.queryCommandState("insertUnorderedList")) document.execCommand("insertUnorderedList");
      if (document.queryCommandState("insertOrderedList")) document.execCommand("insertOrderedList");
      document.execCommand("formatBlock", false, "P");
    } catch {
      // best effort
    }
    emit();
  }

  function link() {
    const url = prompt("link to… (https://)");
    if (!url) return;
    if (!/^https?:\/\/|^mailto:|^\//i.test(url)) return alert("links must start with https://, mailto: or /");
    document.execCommand("createLink", false, url);
    emit();
  }

  // nudge the selection's font size up/down a couple px
  function bumpSize(delta: number) {
    if (!ensureSelection()) return;
    const node = window.getSelection()?.anchorNode ?? null;
    const el = (node?.nodeType === 3 ? node.parentElement : (node as Element | null)) ?? null;
    const cur = el ? parseFloat(getComputedStyle(el).fontSize) : 16;
    const next = Math.max(8, Math.min(96, Math.round((cur || 16) + delta)));
    wrapSelection({ "font-size": `${next}px` });
  }

  // format painter: capture the current look, then paint it onto the next selection
  function capturePainter() {
    if (painter) {
      setPainter(null);
      return;
    }
    if (!ensureSelection()) return;
    const node = window.getSelection()?.anchorNode ?? null;
    const el = (node?.nodeType === 3 ? node.parentElement : (node as Element | null)) ?? null;
    if (!el) return;
    const cs = getComputedStyle(el);
    const styles: Record<string, string> = {
      "font-family": cs.fontFamily,
      "font-size": cs.fontSize,
      color: cs.color,
      "font-weight": cs.fontWeight,
      "font-style": cs.fontStyle,
    };
    if (cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)")
      styles["background-color"] = cs.backgroundColor;
    if (cs.textDecorationLine && cs.textDecorationLine !== "none")
      styles["text-decoration"] = cs.textDecorationLine;
    setPainter(styles);
  }

  // once armed, paint the captured styles onto the next selection you make.
  // Deferring the read lets double-click / keyboard selections settle first
  // (they aren't set yet when mouseup fires), and keyup covers shift+arrow.
  useEffect(() => {
    if (!painter) return;
    const surface = ref.current;
    if (!surface) return;
    let done = false;
    const apply = () => {
      if (done) return;
      const s = window.getSelection();
      if (s && s.rangeCount && !s.isCollapsed && surface.contains(s.anchorNode)) {
        done = true;
        wrapSelection(painter);
        setPainter(null);
      }
    };
    const onEnd = () => setTimeout(apply, 0);
    surface.addEventListener("mouseup", onEnd);
    surface.addEventListener("keyup", onEnd);
    return () => {
      surface.removeEventListener("mouseup", onEnd);
      surface.removeEventListener("keyup", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [painter]);

  // keep the selection alive while clicking toolbar buttons
  const keepSel = (e: React.MouseEvent) => e.preventDefault();

  // small dropdown helpers so the toolbar stays compact (font/size/color/…)
  const menuWrap = `absolute left-0 top-full z-20 mt-1 flex max-w-[15rem] flex-wrap gap-1 rounded-2xl border p-2 shadow-lg ${
    dark ? "border-white/10 bg-[#2a2a34]" : "border-ink/10 bg-white"
  }`;
  const menuItem = `w-full rounded-lg px-2 py-1 text-left font-body text-xs ${
    dark ? "text-cream hover:bg-white/10" : "text-ink hover:bg-blush/20"
  }`;
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
    <div
      className={`group relative rounded-3xl border shadow-sm backdrop-blur transition focus-within:border-blush focus-within:ring-2 focus-within:ring-blush/50 ${
        menu ? "z-30" : ""
      } ${dark ? "border-white/15 bg-[#1c1c24]/95" : "border-white/70 bg-white/70"}`}
    >
      <div
        onMouseDown={keepSel}
        className={`${
          toolbarOnFocus ? "hidden group-focus-within:flex" : "flex"
        } flex-wrap items-center gap-1.5 rounded-t-3xl border-b px-3 py-2 ${
          dark ? "border-white/10 bg-white/5" : "border-ink/10 bg-white/60"
        }`}
      >
        <button type="button" title="undo (⌘Z)" onClick={() => cmd("undo")} className={tbBtn}>↺</button>
        <button type="button" title="redo (⌘⇧Z)" onClick={() => cmd("redo")} className={tbBtn}>↻</button>
        <span className={sep} />

        {/* font */}
        {drop(
          "font",
          "font",
          "font",
          <>
            {FONTS.map(([label, family]) => (
              <button
                key={label}
                type="button"
                onClick={() => { wrapSelection({ "font-family": family }); setMenu(null); }}
                className={menuItem}
                style={{ fontFamily: family }}
              >
                {label}
              </button>
            ))}
            <div className={`my-1 w-full border-t ${dark ? "border-white/10" : "border-ink/10"}`} />
            <p className={`w-full font-body text-[10px] font-bold uppercase tracking-wide ${dark ? "text-cream/60" : "text-ink-soft/70"}`}>
              more
            </p>
            {FONTS_MORE.map(([label, family]) => (
              <button
                key={label}
                type="button"
                onClick={() => { wrapSelection({ "font-family": family }); setMenu(null); }}
                className={menuItem}
                style={{ fontFamily: family }}
              >
                {label}
              </button>
            ))}
          </>,
        )}

        {/* size + fine adjust */}
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
        {/* size stepper: − [px] + */}
        <span className="inline-flex items-center gap-0.5">
          <button type="button" title="smaller" onClick={() => bumpSize(-1)} className={tbBtn}>−</button>
          <input
            type="number"
            min={6}
            max={200}
            value={curSize ?? ""}
            placeholder="px"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              setCurSize(Number.isNaN(n) ? null : n);
              if (n >= 6 && n <= 200) wrapSelection({ "font-size": `${n}px` });
            }}
            className={`w-10 rounded-lg px-1 py-0.5 text-center font-body text-xs outline-none ${
              dark ? "bg-white/10 text-cream" : "bg-white/80 text-ink"
            }`}
          />
          <button type="button" title="bigger" onClick={() => bumpSize(1)} className={tbBtn}>+</button>
        </span>

        {/* color: text + highlight */}
        {drop(
          "color",
          "🎨",
          "text & highlight colour",
          <>
            <p className={`w-full font-body text-[10px] font-bold uppercase tracking-wide ${dark ? "text-cream/60" : "text-ink-soft/70"}`}>text</p>
            <div className="flex w-full flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button key={`t${c}`} type="button" aria-label={`text ${c}`} onClick={() => { wrapSelection({ color: c }); setMenu(null); }} className="h-5 w-5 rounded-full ring-1 ring-ink/20 transition hover:scale-110" style={{ backgroundColor: c }} />
              ))}
            </div>
            <p className={`mt-1 w-full font-body text-[10px] font-bold uppercase tracking-wide ${dark ? "text-cream/60" : "text-ink-soft/70"}`}>highlight</p>
            <div className="flex w-full flex-wrap gap-1.5">
              {COLORS.map((c) => (
                <button key={`h${c}`} type="button" aria-label={`highlight ${c}`} onClick={() => { wrapSelection({ "background-color": c }); setMenu(null); }} className="h-5 w-5 rounded-md ring-1 ring-ink/20 transition hover:scale-110" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className={`my-1 w-full border-t ${dark ? "border-white/10" : "border-ink/10"}`} />
            <p className={`w-full font-body text-[10px] font-bold uppercase tracking-wide ${dark ? "text-cream/60" : "text-ink-soft/70"}`}>custom (hex / slider)</p>
            <div className="flex w-full items-center gap-2">
              <label className={`flex items-center gap-1 font-body text-[11px] ${dark ? "text-cream/80" : "text-ink-soft"}`}>
                text
                <input type="color" defaultValue="#4a4a5e" onMouseDown={(e) => e.stopPropagation()} onChange={(e) => wrapSelection({ color: e.target.value })} className="h-6 w-7 cursor-pointer rounded border-0 bg-transparent p-0" />
              </label>
              <label className={`flex items-center gap-1 font-body text-[11px] ${dark ? "text-cream/80" : "text-ink-soft"}`}>
                bg
                <input type="color" defaultValue="#fff3b0" onMouseDown={(e) => e.stopPropagation()} onChange={(e) => wrapSelection({ "background-color": e.target.value })} className="h-6 w-7 cursor-pointer rounded border-0 bg-transparent p-0" />
              </label>
            </div>
            <input
              type="text"
              placeholder="#hex + enter"
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const raw = e.currentTarget.value.trim().replace(/^#/, "");
                if (/^[0-9a-f]{3,8}$/i.test(raw)) wrapSelection({ color: `#${raw}` });
              }}
              className={`w-full rounded-lg px-2 py-1 font-body text-xs outline-none ${dark ? "bg-white/10 text-cream placeholder:text-cream/40" : "bg-white/70 text-ink placeholder:text-ink-soft/50"}`}
            />
          </>,
        )}
        <span className={sep} />

        {/* inline emphasis */}
        <button type="button" title="bold (⌘B)" onClick={() => cmd("bold")} className={`${tbBtn} font-extrabold`}>B</button>
        <button type="button" title="italic (⌘I)" onClick={() => cmd("italic")} className={`${tbBtn} italic`}>I</button>
        <button type="button" title="underline (⌘U)" onClick={() => cmd("underline")} className={`${tbBtn} underline`}>U</button>
        <button type="button" title="strikethrough" onClick={() => cmd("strikeThrough")} className={`${tbBtn} line-through`}>S</button>
        <span className={sep} />

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
        <span className={sep} />

        {/* format painter */}
        <button
          type="button"
          title={painter ? "painting… select text to apply (click to cancel)" : "format painter: capture this style, then select text to paint it on"}
          onClick={capturePainter}
          className={`${tbBtn} ${painter ? "ring-2 ring-blush " + (dark ? "bg-blush/30" : "bg-blush/40") : ""}`}
        >
          🖌
        </button>
        <span className={sep} />

        {/* ✨ rephrase: her private writing assistant */}
        <div className="relative">
          <button
            type="button"
            title="rephrase the selected text (select something first)"
            onClick={() => {
              if (menu === "rephrase") return setMenu(null);
              if (!ensureSelection()) return;
              const t = window.getSelection()?.toString().trim() ?? "";
              if (!t) return;
              setRephraseText(t);
              setMenu("rephrase");
            }}
            className={tbBtn}
          >
            ✨
          </button>
          {menu === "rephrase" && (
            <div
              className={`absolute left-0 top-full z-20 mt-1 rounded-2xl border p-2.5 shadow-lg ${
                dark ? "border-white/10 bg-[#2a2a34]" : "border-ink/10 bg-white"
              }`}
            >
              <RephrasePanel
                dark={dark}
                text={rephraseText}
                onPick={(t) => {
                  if (ensureSelection()) {
                    document.execCommand("insertText", false, t);
                    emit();
                  }
                  setMenu(null);
                }}
              />
            </div>
          )}
        </div>
        <span className={sep} />

        {/* code, link, clear */}
        <button type="button" title="inline code" onClick={() => wrapSelection({}, "code")} className={`${tbBtn} font-mono`}>{"<>"}</button>
        <button type="button" title="code block" onClick={() => cmd("formatBlock", "PRE")} className={`${tbBtn} font-mono`}>{"{ }"}</button>
        <button type="button" title="add a link" onClick={link} className={tbBtn}>🔗</button>
        <button type="button" title="clear formatting (removes bullets/headings too)" onClick={clearBlock} className={tbBtn}>⌫</button>
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
