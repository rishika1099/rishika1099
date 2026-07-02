"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Counts a visit per page view (aggregate-only analytics, no cookies/IDs).
export default function VisitPing() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/stats")) return;
    const payload = JSON.stringify({ path: pathname });
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
