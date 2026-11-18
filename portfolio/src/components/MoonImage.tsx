"use client";

import { useFeatureCopy } from "./FeatureCopy";
import { useEffect, useState } from "react";
import { moonAt } from "@/lib/nightSky";
import styles from "./MoonImage.module.css";

export default function MoonImage({ date }: { date: Date }) {
  const t = useFeatureCopy();
  const [image, setImage] = useState<{ image: string; illumination?: number; approximate: boolean; at: string } | null>(null);
  const [failedImage, setFailedImage] = useState("");
  const [finishedHour, setFinishedHour] = useState("");
  const hour = date.toISOString().slice(0, 13) + ":00";
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/garden/moon?at=${encodeURIComponent(hour)}`, { signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => { setImage(data); setFinishedHour(hour); }).catch(() => { if (!controller.signal.aborted) setFinishedHour(hour); });
    return () => controller.abort();
  }, [hour]);
  const valid = image?.at === hour && failedImage !== image.image;
  const moon = moonAt(date);
  return <div className={styles.moon}>
    {valid ? <img className={styles.moonImage} src={image.image} width="68" height="68" alt={t("poems.moon.alt")} onError={() => setFailedImage(image.image)} /> : <span aria-hidden="true">{moon.icon}</span>}
    <div><strong>{t("poems.moon.phase", { phase: t(`poems.phase.${moon.name.replaceAll(" ", "_")}`) })}</strong><small>{t("poems.moon.making")}</small>
      <small className={styles.moonDetail}>{valid && !image.approximate && image.illumination !== undefined ? t("poems.moon.lit", { percent: Math.round(image.illumination) }) : t("poems.moon.approximate", { percent: moon.illumination })}</small>
      {valid ? <a className={styles.moonCredit} href="https://svs.gsfc.nasa.gov/gallery/moonphase/" target="_blank" rel="noreferrer">{t("poems.moon.credit")}</a> : <small className={styles.moonDetail}>{finishedHour === hour ? t("poems.moon.unavailable") : t("poems.moon.fetching")}</small>}
    </div>
  </div>;
}

