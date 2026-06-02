"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Mode = "playful" | "recruiter";

interface ModeCtx {
  mode: Mode;
  toggle: () => void;
}

const Ctx = createContext<ModeCtx>({ mode: "playful", toggle: () => {} });

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("playful");

  // restore the visitor's last choice
  useEffect(() => {
    const saved = localStorage.getItem("site-mode");
    if (saved === "recruiter" || saved === "playful") setMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("site-mode", mode);
  }, [mode]);

  const toggle = () => setMode((m) => (m === "playful" ? "recruiter" : "playful"));

  return <Ctx.Provider value={{ mode, toggle }}>{children}</Ctx.Provider>;
}

export const useMode = () => useContext(Ctx);
