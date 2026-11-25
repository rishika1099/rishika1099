"use client";

import { useEffect, useRef, useState } from "react";
import { useFeatureCopy } from "./FeatureCopy";
import { Butterfly, FlowerSprig, GardenScene, gardenMoods, moodFor } from "./GardenFlowers";
import styles from "./GuestbookGarden.module.css";

export interface GuestEntry {
  id: string;
  name: string;
  message: string;
  mood?: string;
  at: string;
}

const BED_SIZE = 8;
const restingSpots = [[12, 29], [37, 10], [61, 30], [86, 15], [25, 53], [49, 48], [73, 57], [91, 43]];

function NoteDialog({ entry, onClose }: { entry: GuestEntry; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const t = useFeatureCopy();
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog ref={ref} className={styles.dialog} onClose={onClose} aria-labelledby="garden-note-name" onClick={event => { if (event.target === event.currentTarget) ref.current?.close(); }}>
    <button autoFocus type="button" className={styles.close} onClick={() => ref.current?.close()}>{t("contact.garden.close")}</button>
    <svg className={styles.flower} viewBox="-35 -115 70 120" aria-hidden="true"><FlowerSprig mood={moodFor(entry.mood)} /></svg>
    <h3 id="garden-note-name">{entry.name || t("contact.guestbook.anonymous")}</h3>
    <p className={styles.message}>{entry.message}</p>
    <p className={styles.mood}>{t(`contact.garden.mood.${moodFor(entry.mood)}`)} · {t(`contact.garden.flower.${gardenMoods[moodFor(entry.mood)].flower}`)}</p>
    <time dateTime={entry.at}>{new Date(entry.at).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })}</time>
  </dialog>;
}

export default function GuestbookGarden({ entries }: { entries: GuestEntry[] }) {
  const t = useFeatureCopy();
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const pages = Math.max(1, Math.ceil(entries.length / BED_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = entries.slice(current * BED_SIZE, (current + 1) * BED_SIZE);
  const selected = entries.find(entry => entry.id === selectedId);
  return <div className={styles.garden}>
    <div className={styles.toolbar}>
      <p>{t("contact.garden.count", { count: entries.length })}</p>

    </div>
    <div className={styles.scene}>
      <GardenScene />
      {!entries.length ? <p className={styles.empty}>{t("contact.garden.empty")}</p> :
        <ul className={styles.bed} aria-label={t("contact.garden.garden")}>
          {visible.map((entry, index) => <li key={entry.id} style={{ left: `${restingSpots[index][0]}%`, top: `${restingSpots[index][1]}%` }}>
            <button className={styles.bloom} type="button" aria-haspopup="dialog" aria-label={t("contact.garden.open", { name: entry.name || t("contact.guestbook.anonymous") })} onClick={() => setSelectedId(entry.id)}>
              <Butterfly mood={moodFor(entry.mood)} />
              <span>{entry.name || t("contact.guestbook.anonymous")}</span>
            </button>
          </li>)}
        </ul>}
    </div>
    {pages > 1 && <nav className={styles.pagination} aria-label={t("contact.garden.beds")}>
      <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)}>{t("contact.garden.previous")}</button>
      <span role="status">{t("contact.garden.page", { page: current + 1, total: pages })}</span>
      <button type="button" disabled={current === pages - 1} onClick={() => setPage(current + 1)}>{t("contact.garden.next")}</button>
    </nav>}
    {selected && <NoteDialog key={selected.id} entry={selected} onClose={() => setSelectedId(null)} />}
  </div>;
}
