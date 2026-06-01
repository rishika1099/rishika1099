"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

const STARTERS = [
  "What has Rishika worked on in healthcare?",
  "Tell me about her LLM experience",
  "Where did she study?",
  "What are her strongest skills?",
];

export default function AskMe() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "hi! i'm Rishika's little portfolio guide 🌸 ask me about her work, research, projects, or studies.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (res.status === 503) {
        setMessages((m) => [
          ...m,
          { role: "bot", text: "my chat brain isn't switched on for this deploy yet. ✦" },
        ]);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { answer: string; sources?: Source[] };
      setMessages((m) => [...m, { role: "bot", text: data.answer, sources: data.sources }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "oops, something fluttered away. try asking again in a moment? ✦" },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Floating launcher */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "close the portfolio guide" : "ask about Rishika"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-blush px-5 py-3.5 font-body text-sm font-bold text-ink shadow-lg shadow-blush/50 ring-2 ring-white/70 backdrop-blur transition hover:brightness-105"
      >
        <motion.span
          animate={{ rotate: open ? 0 : [0, 12, -8, 0] }}
          transition={{ repeat: open ? 0 : Infinity, repeatDelay: 1.6, duration: 1.2 }}
          className="text-xl"
        >
          {open ? "✕" : "🌸"}
        </motion.span>
        {open ? "close" : "ask about me"}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[1.75rem] border border-white/70 bg-cream/95 shadow-2xl backdrop-blur"
          >
            <div className="flex items-center gap-2 border-b border-ink/10 bg-white/60 px-4 py-3">
              <span className="text-xl">🌸</span>
              <div>
                <p className="font-body text-sm font-bold text-ink">ask about Rishika</p>
                <p className="font-body text-[11px] text-ink-soft">
                  answers grounded in her real portfolio
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
                    <p className="whitespace-pre-line">{m.text}</p>
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

              {busy && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white/80 px-3.5 py-2 font-body text-sm text-ink-soft">
                    thinking… 🌷
                  </div>
                </div>
              )}

              {messages.length <= 1 && !busy && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {STARTERS.map((s) => (
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
                placeholder="ask me something…"
                aria-label="ask about Rishika"
                className="flex-1 rounded-full border border-ink/10 bg-white px-4 py-2 font-body text-sm text-ink outline-none transition focus:border-blush focus:ring-2 focus:ring-blush/30"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blush/90 text-base text-ink transition hover:bg-blush disabled:opacity-50"
                aria-label="send"
              >
                ➤
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
