"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Counts a page view (aggregate-only, no cookies/IDs). Once per session it also
// reports the referrer, the campaign tag a link was shared with, the landing
// page, and coarse context (language / timezone / viewport bucket), plus a
// new-vs-returning flag (a plain localStorage flag, non-identifying).
// Per page it reports how far it was scrolled and how long it stayed engaged.
// Everything is stored as independent aggregate tallies, never joined per
// visitor, so none of it composes into a fingerprint.

function viewportBucket(w: number): string {
  if (w <= 480) return "≤480";
  if (w <= 768) return "481-768";
  if (w <= 1024) return "769-1024";
  if (w <= 1440) return "1025-1440";
  return ">1440";
}

/** the campaign a link was tagged with, e.g. ?utm_source=acme-application */
function campaignFrom(search: string): string | undefined {
  try {
    const p = new URLSearchParams(search);
    const source = p.get("utm_source") || p.get("ref") || p.get("source");
    if (!source) return undefined;
    const name = p.get("utm_campaign");
    const medium = p.get("utm_medium");
    const tail = [medium, name].filter(Boolean).join(" · ");
    return (tail ? `${source} · ${tail}` : source).slice(0, 80);
  } catch {
    return undefined;
  }
}

function beacon(url: string, payload: unknown) {
  try {
    const body = JSON.stringify(payload);
    if (!navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) {
      fetch(url, { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {
    // analytics must never affect the page
  }
}

export default function VisitPing() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/stats")) return;
    // don't count the owner's own device (or anyone who opted out)
    try {
      if (
        localStorage.getItem("no-track") ||
        localStorage.getItem("admin-key") ||
        localStorage.getItem("stats-key")
      )
        return;
    } catch {
      // storage blocked: fall through and count normally
    }

    const extra: Record<string, string> = {};
    try {
      // a throwaway session token (cleared when the tab closes) so pages within
      // one visit can be linked into a journey, never tied to identity
      let sid = sessionStorage.getItem("v_sid");
      if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem("v_sid", sid);
      }
      extra.sid = sid;
      if (!sessionStorage.getItem("v_session")) {
        sessionStorage.setItem("v_session", "1");
        const returning = !!localStorage.getItem("v_seen");
        localStorage.setItem("v_seen", "1");
        extra.visitor = returning ? "returning" : "new";
        extra.entry = pathname;
        if (document.referrer) {
          extra.referrer = document.referrer;
          // the full referring URL (host + path), so "which post sent them" is answerable
          try {
            const r = new URL(document.referrer);
            if (r.hostname !== location.hostname) {
              extra.refPath = (r.hostname + r.pathname).replace(/\/$/, "").slice(0, 160);
            }
          } catch {
            // unparseable referrer: skip
          }
        }
        const campaign = campaignFrom(location.search);
        if (campaign) extra.campaign = campaign;
        const lang = navigator.language;
        if (lang) extra.lang = lang;
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (tz) extra.timezone = tz;
        } catch {
          // no Intl: skip
        }
        extra.viewport = viewportBucket(window.innerWidth);
      }
    } catch {
      // storage blocked: still count the page view
    }

    beacon("/api/visit", { path: pathname, ...extra });

    // ---- read depth + engaged time for this page ----
    let maxDepth = 0;
    let engagedMs = 0;
    let since = document.visibilityState === "visible" ? Date.now() : 0;

    const measure = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct =
        scrollable <= 0 ? 100 : ((window.scrollY + window.innerHeight) / doc.scrollHeight) * 100;
      maxDepth = Math.max(maxDepth, Math.min(100, pct));
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        since = Date.now();
      } else if (since) {
        engagedMs += Date.now() - since;
        since = 0;
      }
    };

    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    let sent = false;
    const report = () => {
      if (sent) return;
      sent = true;
      if (since) {
        engagedMs += Date.now() - since;
        since = 0;
      }
      const seconds = Math.round(engagedMs / 1000);
      const depth = Math.round(maxDepth);
      if (seconds < 1 && depth <= 0) return;
      beacon("/api/event", { kind: "read", path: pathname, depth, seconds });
    };
    window.addEventListener("pagehide", report);

    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", report);
      report(); // route change: this page is done
    };
  }, [pathname]);
  return null;
}
