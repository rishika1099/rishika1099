"use client";

import { usePathname } from "next/navigation";

/**
 * The whimsical furniture: nav, footer, the butterfly, the ask box. Every page
 * wears it except the recruiter view, whose whole point is to be plain. Hiding
 * it here rather than restructuring the app directory into route groups keeps
 * one layout for one site, with a single named exception.
 */
const BARE = ["/recruiter"];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "";
  if (BARE.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return <>{children}</>;
}
