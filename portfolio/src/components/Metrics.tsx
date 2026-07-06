"use client";

import { useEffect } from "react";

// Fire-and-forget analytics events: outbound / conversion clicks, form submits,
// on-site search usage, and Core Web Vitals (LCP / CLS / INP / TTFB / FCP).
// All aggregate + non-identifying, so no consent banner is needed.

function send(name: string, value?: number) {
  try {
    const body = JSON.stringify(value !== undefined ? { name, value } : { name });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/event", blob)) {
      fetch("/api/event", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {
    // analytics must never break the page
  }
}

// map an anchor's href to a named conversion/click event (or null to ignore)
function classify(href: string): string | null {
  if (!href) return null;
  if (href.startsWith("/resume") || /resume.*\.pdf/i.test(href)) return "download: resume";
  if (href.startsWith("mailto:")) return "click: email";
  if (/github\.com/i.test(href)) return "click: github";
  if (/linkedin\.com/i.test(href)) return "click: linkedin";
  if (/substack\.com/i.test(href)) return "click: substack";
  if (/^https?:\/\//i.test(href)) return "click: outbound";
  return null; // internal navigation is already a page view
}

export default function Metrics() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a) return;
      const name = classify(a.getAttribute("href") ?? "");
      if (name) send(name);
    };
    const onSubmit = () => send("conversion: form submit");
    const onPalette = () => send("open: search");
    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("submit", onSubmit, { capture: true });
    window.addEventListener("open-command-palette", onPalette);

    // ---- Core Web Vitals (lightweight, no external lib) ----
    let lcp = 0;
    let cls = 0;
    let inp = 0;
    const obs: PerformanceObserver[] = [];
    const observe = (type: string, cb: (e: PerformanceEntry[]) => void, opts: PerformanceObserverInit = {}) => {
      try {
        const po = new PerformanceObserver((l) => cb(l.getEntries()));
        po.observe({ type, buffered: true, ...opts } as PerformanceObserverInit);
        obs.push(po);
      } catch {
        // unsupported entry type: skip
      }
    };
    observe("largest-contentful-paint", (es) => {
      const last = es[es.length - 1] as PerformanceEntry & { startTime: number };
      if (last) lcp = Math.round(last.startTime);
    });
    observe("layout-shift", (es) => {
      for (const e of es as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!e.hadRecentInput) cls += e.value;
      }
    });
    observe(
      "event",
      (es) => {
        for (const e of es as (PerformanceEntry & { duration: number })[]) {
          inp = Math.max(inp, Math.round(e.duration));
        }
      },
      { durationThreshold: 40 } as PerformanceObserverInit,
    );
    // FCP + TTFB straight from timing
    try {
      const fcp = performance.getEntriesByName("first-contentful-paint")[0];
      if (fcp) send("FCP", Math.round(fcp.startTime));
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav) send("TTFB", Math.round(nav.responseStart));
    } catch {
      // ignore
    }

    let reported = false;
    const report = () => {
      if (reported) return;
      reported = true;
      if (lcp) send("LCP", lcp);
      if (cls) send("CLS", Math.round(cls * 1000) / 1000);
      if (inp) send("INP", inp);
    };
    const onHide = () => document.visibilityState === "hidden" && report();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", report);

    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("submit", onSubmit, { capture: true });
      window.removeEventListener("open-command-palette", onPalette);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", report);
      obs.forEach((o) => o.disconnect());
    };
  }, []);
  return null;
}
