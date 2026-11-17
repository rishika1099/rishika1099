"use client";

import { useEffect, useState } from "react";
import { moonAt } from "@/lib/nightSky";
import styles from "./MoonImage.module.css";

export default function MoonImage({ date }: { date: Date }) {
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
    {valid ? <img className={styles.moonImage} src={image.image} width="68" height="68" alt="NASA rendering of the Moon for the displayed hour" onError={() => setFailedImage(image.image)} /> : <span aria-hidden="true">{moon.icon}</span>}
    <div><strong>Currently: {moon.name}.</strong><small>Also currently: making things.</small>
      <small className={styles.moonDetail}>{valid && !image.approximate && image.illumination !== undefined ? Math.round(image.illumination) : `About ${moon.illumination}`}% illuminated</small>
      {valid ? <a className={styles.moonCredit} href="https://svs.gsfc.nasa.gov/gallery/moonphase/" target="_blank" rel="noreferrer">NASA / Goddard lunar rendering ↗</a> : <small className={styles.moonDetail}>{finishedHour === hour ? "Approximate phase; NASA imagery unavailable." : "Loading NASA moon imagery…"}</small>}
    </div>
  </div>;
}

