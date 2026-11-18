"use client";
import { createContext, useContext, type ReactNode } from "react";
import { copyDefaults } from "@/data/copy";
const Context = createContext<Record<string, string>>({});
export function FeatureCopy({ copy, children }: { copy: Record<string, string>; children: ReactNode }) {
  return <Context.Provider value={copy}>{children}</Context.Provider>;
}
// Labels may also have been saved through the atelier's rich text editor.
function plain(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
export function useFeatureCopy() {
  const copy = useContext(Context);
  return (key: string, values: Record<string, string | number> = {}) =>
    plain(copy[key] ?? copyDefaults[key]?.text ?? "").replace(/\{(\w+)\}/g, (match, name) => String(values[name] ?? match));
}
