"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/**
 * The chat panel and the command palette, kept off the critical path.
 *
 * Neither is needed to read a page: the chat starts closed and the palette
 * waits for ⌘K. Loading them from the layout meant every route, including the
 * homepage, downloaded a chat panel and the entire project catalogue before
 * anything could paint. They are warmed once the browser is idle instead, so
 * in practice they are mounted long before anyone reaches for them.
 *
 * Both open by listening for a window event, so if someone is quicker than the
 * idle callback we mount on the spot and replay the trigger once the real
 * listeners exist.
 */
const AskMe = dynamic(() => import("@/components/AskMe"), { ssr: false });
const CommandPalette = dynamic(() => import("@/components/CommandPalette"), { ssr: false });

export default function DeferredUI() {
  const [ready, setReady] = useState(false);
  const readyRef = useRef(false);

  useEffect(() => {
    const warm = () => {
      readyRef.current = true;
      setReady(true);
    };

    // fetch the chunks ourselves so a replayed trigger only waits on a render,
    // not on the network
    const warmNow = () =>
      Promise.all([import("@/components/AskMe"), import("@/components/CommandPalette")]).then(warm);

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    const w = window as IdleWindow;
    let idleId: number | undefined;
    let timerId: number | undefined;
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(() => void warmNow(), { timeout: 2500 });
    else timerId = window.setTimeout(() => void warmNow(), 1200);

    // Anyone reaching for either one before the idle pass: mount, then hand the
    // trigger back once the component that listens for it actually exists.
    const rush = (make: () => Event) => {
      if (readyRef.current) return;
      void warmNow().then(() => window.setTimeout(() => window.dispatchEvent(make()), 50));
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        rush(() => new CustomEvent("open-command-palette"));
      }
    };
    const onPalette = () => rush(() => new CustomEvent("open-command-palette"));
    const onAsk = (e: Event) =>
      rush(() => new CustomEvent("ask-question", { detail: (e as CustomEvent).detail }));

    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onPalette);
    window.addEventListener("ask-question", onAsk);
    return () => {
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId);
      if (timerId !== undefined) clearTimeout(timerId);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onPalette);
      window.removeEventListener("ask-question", onAsk);
    };
  }, []);

  if (!ready) return null;
  return (
    <>
      <AskMe />
      <CommandPalette />
    </>
  );
}
