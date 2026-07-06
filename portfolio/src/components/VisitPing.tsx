"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Counts a page view (aggregate-only, no cookies/IDs). Once per session it also
// reports the referrer and whether this browser is a new or returning visitor
// (a plain localStorage flag, non-identifying).
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

    let extra: { visitor?: string; referrer?: string } = {};
    try {
      if (!sessionStorage.getItem("v_session")) {
        sessionStorage.setItem("v_session", "1");
        const returning = !!localStorage.getItem("v_seen");
        localStorage.setItem("v_seen", "1");
        extra = { visitor: returning ? "returning" : "new", referrer: document.referrer || undefined };
      }
    } catch {
      // storage blocked: still count the page view
    }

    const payload = JSON.stringify({ path: pathname, ...extra });
    try {
      if (!navigator.sendBeacon?.("/api/visit", new Blob([payload], { type: "application/json" }))) {
        fetch("/api/visit", { method: "POST", body: payload, keepalive: true }).catch(() => {});
      }
    } catch {
      // never let analytics affect the page
    }
  }, [pathname]);
  return null;
}
