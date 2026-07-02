"use client";

import { useEffect, useState } from "react";

// Little "n views" tag fed by the aggregate visit counter.
export default function ViewCount({ path }: { path: string }) {
  const [views, setViews] = useState<number | null>(null);
  useEffect(() => {
    fetch(`/api/views?path=${encodeURIComponent(path)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { views?: number }) => setViews(d.views ?? 0))
      .catch(() => setViews(null));
  }, [path]);
  if (views === null || views < 1) return null;
  return <span>· {views} view{views === 1 ? "" : "s"} 🌱</span>;
}
