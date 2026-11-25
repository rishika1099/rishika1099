"use client";

import { useEffect, useRef, useState } from "react";
import { useFeatureCopy } from "./FeatureCopy";
import styles from "./Pebble.module.css";
import { usePathname } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";

// The launcher mounts in the root layout, outside the vibe wrapper, so it
// cannot inherit the ground it is floating over. It reads the accent the page
// publishes, and falls back to this map for anything not built on PageShell.
// The map alone had to know every route, and quietly served dawn peach to every
// page nobody had added to it.
// tint the launcher to the current page's vibe so it feels integrated, the
// white ring + shadow keep it visible against the matching background
function launcherTint(path: string): string {
  if (path.startsWith("/about")) return "#d9c2f0"; // lilac
  if (path.startsWith("/work")) return "#bfe3b0"; // meadow
  if (path.startsWith("/blog/technical/under-the-hood")) return "#c5e8d5"; // aurora
  if (path.startsWith("/blog/technical")) return "#bfe0f0"; // azure
  if (path.startsWith("/blog/photography")) return "#ffc0a0"; // sunset
  if (path.startsWith("/blog/poems")) return "#d9c2f0"; // twilight (light pill on dark)
  if (path.startsWith("/blog")) return "#ffd9a8"; // peach
  if (path.startsWith("/contact")) return "#f7a8bc"; // rose
  if (path.startsWith("/analytics")) return "#c7d3f2"; // midnight (moonlit periwinkle)
  return "#ffd0b0"; // dawn (home, /now + fallback)
}

interface Source {
  title: string;
  kind: string;
  href?: string;
}
interface Message {
  role: "user" | "bot";
  text: string;
  sources?: Source[];
}

// Replace the most recent bot message via a transform (used while streaming).
function withLastBot(arr: Message[], fn: (b: Message) => Message): Message[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i >= 0; i--) {
    if (copy[i].role === "bot") {
      copy[i] = fn(copy[i]);
      break;
    }
  }
  return copy;
}

function Otter() {
  return <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className={styles.otter}>
    <ellipse cx="50" cy="92" rx="30" ry="5" fill="#bba5cb" opacity=".25" />
    <path d="M72 67q24 13 9 23q-10 5-22-4" fill="#956b56" />
    <ellipse cx="50" cy="70" rx="27" ry="25" fill="#ae8166" />
    <ellipse cx="50" cy="74" rx="18" ry="19" fill="#f5dfc4" />
    <circle cx="24" cy="28" r="11" fill="#956b56" /><circle cx="76" cy="28" r="11" fill="#956b56" />
    <circle cx="24" cy="28" r="6" fill="#e8b9ac" /><circle cx="76" cy="28" r="6" fill="#e8b9ac" />
    <ellipse cx="50" cy="39" rx="33" ry="28" fill="#ae8166" />
    <path d="M22 40q4-22 22-10q6 5 12 0q18-12 22 10q0 25-28 26q-28-1-28-26" fill="#f5dfc4" />
    <ellipse cx="36" cy="39" rx="3.4" ry="4.3" fill="#433c49" /><ellipse cx="64" cy="39" rx="3.4" ry="4.3" fill="#433c49" />
    <circle cx="37" cy="38" r="1.2" fill="white" /><circle cx="65" cy="38" r="1.2" fill="white" />
    <ellipse cx="29" cy="48" rx="6" ry="3" fill="#eab5b5" /><ellipse cx="71" cy="48" rx="6" ry="3" fill="#eab5b5" />
    <path d="M45 46q5-4 10 0q0 6-5 6q-5 0-5-6" fill="#51414a" />
    <path d="M50 52v3m0 0q-5 6-9 0m9 0q5 6 9 0M19 47l13 2m-14 4 13-1m50-5-13 2m14 4-13-1" fill="none" stroke="#896f67" strokeWidth="1.6" strokeLinecap="round" />
    <ellipse cx="35" cy="91" rx="10" ry="5" fill="#956b56" /><ellipse cx="65" cy="91" rx="10" ry="5" fill="#956b56" />
    <path d="M43 73q-6-10-12-1q-2 7 12 16q14-9 12-16q-6-9-12 1" fill="#c5acd9" />
    <ellipse cx="29" cy="73" rx="7" ry="12" fill="#956b56" transform="rotate(-30 29 73)" />
    <g className={styles.paw}><ellipse cx="79" cy="62" rx="8" ry="13" fill="#ae8166" transform="rotate(30 79 62)" /><ellipse cx="80" cy="60" rx="4" ry="5" fill="#e8b9ac" /></g>
  </svg>;
}

export default function AskMe() {
  const t = useFeatureCopy();
  const reducedMotion = useReducedMotion();
  const pathname = usePathname();
  const tint = launcherTint(pathname);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: reducedMotion ? "instant" : "smooth" });
  }, [messages, busy, open, reducedMotion]);

  // Deep-link: project cards dispatch "ask-question" to open the chat
  // pre-loaded with a question about themselves.
  const askRef = useRef<(q: string) => void>(() => {});
  useEffect(() => {
    const onAsk = (e: Event) => {
      const q = (e as CustomEvent<string>).detail;
      if (!q) return;
      setOpen(true);
      askRef.current(q);
    };
    window.addEventListener("ask-question", onAsk);
    return () => window.removeEventListener("ask-question", onAsk);
  }, []);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setFollowups([]);
    // push the user turn + an empty bot placeholder that fills in as tokens stream
    // recent turns (minus the greeting) so follow-ups like "a demo of it?"
    // keep their referent on the server
    const history = messages
      .slice(1)
      .filter((m) => m.text.trim())
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text.slice(0, 600) }));
    setMessages((m) => [...m, { role: "user", text: q }, { role: "bot", text: "" }]);
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history }),
      });
      if (res.status === 503) {
        setMessages((m) =>
          withLastBot(m, (b) => ({ ...b, text: t("chat.unavailable") })),
        );
        return;
      }
      if (res.status === 429) {
        setMessages((m) =>
          withLastBot(m, (b) => ({
            ...b,
            text: t("chat.limited"),
          })),
        );
        return;
      }
      if (!res.ok || !res.body) throw new Error(String(res.status));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          let ev: { type: string; sources?: Source[]; text?: string; items?: string[] };
          try {
            ev = JSON.parse(line);
          } catch {
            continue;
          }
          if (ev.type === "sources") {
            setMessages((m) => withLastBot(m, (b) => ({ ...b, sources: ev.sources })));
          } else if (ev.type === "delta") {
            setMessages((m) => withLastBot(m, (b) => ({ ...b, text: b.text + (ev.text ?? "") })));
          } else if (ev.type === "followups") {
            setFollowups(ev.items ?? []);
          } else if (ev.type === "error") {
            setMessages((m) =>
              withLastBot(m, (b) => ({
                ...b,
                text: b.text || t("chat.error"),
              })),
            );
          }
        }
      }
      // safety net if the stream produced no answer text
      setMessages((m) =>
        withLastBot(m, (b) =>
          b.text
            ? b
            : { ...b, text: t("chat.unknown") },
        ),
      );
    } catch {
      setMessages((m) =>
        withLastBot(m, (b) => ({
          ...b,
          text: t("chat.error"),
        })),
      );
    } finally {
      setBusy(false);
    }
  }
  // kept current after each render, for the listener above that was set up once
  useEffect(() => {
    askRef.current = ask;
  });

  return (
    <>
      {/* Floating launcher */}
      <m.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? t("chat.closeLabel") : t("chat.openLabel")}
        aria-expanded={open}
        aria-controls="pebble-chat"
        whileHover={reducedMotion ? undefined : { scale: 1.05 }}
        whileTap={reducedMotion ? undefined : { scale: 0.95 }}
        // the sheet colour, not the accent: the accent was a mid tint of the
        // same gradient it floats over, so the button sank into the page
        style={{ backgroundColor: `var(--page-surface, ${tint})` }}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full px-5 py-3.5 font-body text-sm font-bold text-ink shadow-lg shadow-ink/25 backdrop-blur transition hover:brightness-105"
      >
        <span className={styles.launcherOtter}>{open ? <span aria-hidden="true">✕</span> : <Otter />}</span>
        {open ? t("chat.close") : t("chat.launcher")}
      </m.button>

      <AnimatePresence>
        {open && (
          <m.div
            initial={reducedMotion ? false : { opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            role="dialog"
            id="pebble-chat"
            aria-label={t("chat.name")}
            onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}
            className="fixed bottom-24 right-5 z-50 flex h-[28rem] max-h-[calc(100dvh-8rem)] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-cream/95 shadow-2xl backdrop-blur"
          >
            <div className="flex items-center gap-2 border-b border-ink/10 bg-white/60 px-4 py-3">
              <span className={styles.headerOtter}><Otter /></span>
              <div>
                <p className="font-body text-sm font-bold text-ink">{t("chat.name")}</p>
                <p className="font-body text-[11px] text-ink-soft">
                  {t("chat.subtitle")}
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 font-body text-sm ${
                      m.role === "user"
                        ? "bg-ink text-cream"
                        : "bg-white/80 text-ink-soft"
                    }`}
                  >
                    {i === 0 ? <p className="whitespace-pre-line">{t("chat.greeting")}</p> : m.role === "bot" && m.text === "" ? (
                      <p className="whitespace-pre-line italic text-ink-soft/70">{t("chat.thinking")}</p>
                    ) : (
                      <p className="whitespace-pre-line">{m.text}</p>
                    )}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.sources.map((s, j) =>
                          s.href ? (
                            <a
                              key={j}
                              href={s.href}
                              target={s.href.startsWith("http") ? "_blank" : undefined}
                              rel="noreferrer"
                              className="rounded-full bg-mint/70 px-2 py-0.5 font-body text-[10px] font-semibold text-ink-soft transition hover:bg-mint"
                            >
                              {s.kind} · {s.title}
                            </a>
                          ) : (
                            <span
                              key={j}
                              className="rounded-full bg-mint/70 px-2 py-0.5 font-body text-[10px] font-semibold text-ink-soft"
                            >
                              {s.kind} · {s.title}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {messages.length <= 1 && !busy && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["health", "llm", "study", "skills"].map(key => t(`chat.starter.${key}`)).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="rounded-full border border-ink/10 bg-white/70 px-2.5 py-1 text-left font-body text-[11px] text-ink-soft transition hover:bg-white"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {followups.length > 0 && !busy && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {followups.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => ask(f)}
                      className="rounded-full border border-blush/40 bg-blush/15 px-2.5 py-1 text-left font-body text-[11px] text-ink-soft transition hover:bg-blush/30"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="flex items-center gap-2 border-t border-ink/10 bg-white/60 px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chat.placeholder")}
                aria-label={t("chat.inputLabel")}
                className="min-w-0 flex-1 rounded-full border border-ink/10 bg-white px-4 py-2 font-body text-sm text-ink outline-none transition focus:border-blush focus:ring-2 focus:ring-blush/30"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blush/90 text-base text-ink transition hover:bg-blush disabled:opacity-50"
                aria-label={t("chat.send")}
              >
                ➤
              </button>
            </form>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
