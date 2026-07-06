"use client";

// A tiny persisted "edit mode" flag. When it is on, the top nav points at each
// page's in-place /edit route, so you stay editing as you move across tabs. It
// only matters once you're unlocked (the admin key lives in localStorage).

import { useEffect, useState } from "react";

// the top-nav pages → their in-place edit routes
export const EDIT_ROUTE: Record<string, string> = {
  "/": "/edit",
  "/about": "/about/edit",
  "/work": "/work/edit",
  "/blog": "/blog/edit",
  "/contact": "/contact/edit",
  "/now": "/now/edit",
};

const KEY = "edit-mode";

function read() {
  if (typeof window === "undefined") return { on: false, unlocked: false };
  return {
    on: localStorage.getItem(KEY) === "1",
    unlocked: !!localStorage.getItem("admin-key"),
  };
}

/** Turn edit mode on/off and notify any mounted nav. */
export function setEditMode(on: boolean) {
  if (typeof window === "undefined") return;
  if (on) localStorage.setItem(KEY, "1");
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("editmodechange"));
}

/** Subscribe to edit mode (and whether we're unlocked at all). */
export function useEditMode() {
  const [state, setState] = useState({ on: false, unlocked: false });
  useEffect(() => {
    const sync = () => setState(read());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("editmodechange", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("editmodechange", sync);
    };
  }, []);
  return state;
}
