"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useFeatureCopy } from "./FeatureCopy";
import styles from "./GuestbookGarden.module.css";

export interface GuestEntry {
  id: string;
  name: string;
  message: string;
  mood?: string;
  at: string;
}

const blooms: Record<string, { color: string; petals: number }> = {
  sweet: { color: "#db88a8", petals: 8 },
  excited: { color: "#e5ac54", petals: 10 },
  curious: { color: "#89afcf", petals: 6 },
  funny: { color: "#b4b86b", petals: 7 },
  kind: { color: "#b49acb", petals: 8 },
  proud: { color: "#dc9c7d", petals: 6 },
};
const BED_SIZE = 24;

function Flower({ entry }: { entry: GuestEntry }) {
  const bloom = blooms[entry.mood ?? ""] ?? blooms.kind;
  const seed = Array.from(entry.id).reduce((n, c) => n + c.charCodeAt(0), 0);
  const top = 26 + seed % 16;
  return <svg viewBox="0 0 90 130" aria-hidden="true" className={styles.flower} style={{ "--sway-delay": `${-(seed % 7)}s` } as CSSProperties}>
    <ellipse cx="45" cy="123" rx="24" ry="4" fill="#496c5e" opacity=".13" />
    <path d={`M45 122Q${35 + seed % 20} 83 45 ${top}`} fill="none" stroke="#658f77" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M45 100Q19 104 18 79Q39 79 45 100M44 84Q69 88 74 62Q52 62 44 84" fill="#86a58a" />
    <path d="M45 100L23 84M44 84L68 67" fill="none" stroke="#d1dfb0" strokeWidth=".8" />
    <g className={styles.head} style={{ transformOrigin: `45px ${top}px` }}>
      {Array.from({ length: bloom.petals }, (_, i) => <g key={i} transform={`rotate(${i * 360 / bloom.petals} 45 ${top})`}>
        <ellipse cx="45" cy={top - 12} rx={bloom.petals > 8 ? 5 : 7} ry="14" fill={bloom.color} stroke="#fff6e4" strokeWidth=".7" />
        <path d={`M45 ${top - 20}V${top - 6}`} stroke="#fff5e8" opacity=".4" strokeWidth=".8" />
      </g>)}
      <circle cx="45" cy={top} r="7" fill="#f5d57e" stroke="#f8e9b4" strokeWidth="1.3" />
      {[[-2,-2],[2,-1],[0,3]].map(([x,y],i)=><circle key={i} cx={45+x} cy={top+y} r=".8" fill="#a57c4e" />)}
    </g>
  </svg>;
}

function NoteDialog({ entry, onClose }: { entry: GuestEntry; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = useFeatureCopy();
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className={styles.dialog} onClose={onClose} aria-labelledby="garden-note-name" onClick={event => { if (event.target === event.currentTarget) ref.current?.close(); }}>
    <button autoFocus type="button" className={styles.close} onClick={() => ref.current?.close()}>{t("contact.garden.close")}</button>
    <Flower entry={entry} />
    <h3 id="garden-note-name">{entry.name || t("contact.guestbook.anonymous")}</h3>
    <p className={styles.message}>{entry.message}</p>
    {blooms[entry.mood ?? ""] && <p className={styles.mood}>{t(`contact.garden.mood.${entry.mood}`)}</p>}
    <time dateTime={entry.at}>{new Date(entry.at).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}</time>
  </dialog>;
}

export default function GuestbookGarden({ entries }: { entries: GuestEntry[] }) {
  const t = useFeatureCopy();
  const [view, setView] = useState<"garden" | "list">("garden");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pages = Math.max(1, Math.ceil(entries.length / BED_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = entries.slice(current * BED_SIZE, (current + 1) * BED_SIZE);
  const selected = entries.find(entry => entry.id === selectedId);
  return <div className={styles.garden}>
    <div className={styles.toolbar}>
      <p>{t("contact.garden.count", { count: entries.length })}</p>
      <div className={styles.views} role="group" aria-label={t("contact.garden.view")}>
        {(["garden", "list"] as const).map(mode => <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)}>{t(`contact.garden.${mode}`)}</button>)}
      </div>
    </div>
    {!entries.length ? <p className={styles.empty}>{t("contact.garden.empty")}</p> : view === "garden" ?
      <ul className={styles.bed} aria-label={t("contact.garden.garden")}>
        {visible.map(entry => <li key={entry.id}>
          <button className={styles.bloom} type="button" aria-haspopup="dialog" aria-label={t("contact.garden.open", { name: entry.name || t("contact.guestbook.anonymous") })} onClick={() => setSelectedId(entry.id)}>
            <Flower entry={entry} />
            <span>{entry.name || t("contact.guestbook.anonymous")}</span>
          </button>
        </li>)}
      </ul> : <ul className={styles.list}>
        {visible.map(entry => <li key={entry.id}><h3>{entry.name || t("contact.guestbook.anonymous")}</h3><p>{entry.message}</p></li>)}
      </ul>}
    {pages > 1 && <nav className={styles.pagination} aria-label={t("contact.garden.beds")}>
      <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)}>{t("contact.garden.previous")}</button>
      <span role="status">{t("contact.garden.page", { page: current + 1, total: pages })}</span>
      <button type="button" disabled={current === pages - 1} onClick={() => setPage(current + 1)}>{t("contact.garden.next")}</button>
    </nav>}
    {selected && <NoteDialog key={selected.id} entry={selected} onClose={() => setSelectedId(null)} />}
  </div>;
}
