"use client";
import { useFeatureCopy } from "./FeatureCopy";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cities } from "@/lib/nightSky";
import MoonImage from "./MoonImage";
import styles from "./PoemSky.module.css";

export default function PoemSky({ children }: { children?: ReactNode }) {
  const t = useFeatureCopy();
  const mapRef = useRef<HTMLDivElement>(null);
  const [skyVisible, setSkyVisible] = useState(false);
  useEffect(() => {
    const node = mapRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setSkyVisible(true); observer.disconnect(); } }, { rootMargin: "0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const [now, setNow] = useState<Date | null>(null);
  const [city, setCity] = useState(cities[0]);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, []);
  const embed = "https://stellarium-web.org/?" + new URLSearchParams({
    lat: String(city.lat), lng: String(city.lon), elev: "0",
  });
  return <aside className={styles.bento} aria-label={t("poems.sky.label")}>
    <section className={styles.moonTile} aria-labelledby="moon-tile-title">
      <span className={styles.eyebrow}>{t("poems.moon.eyebrow")}</span>
      <h2 id="moon-tile-title"><em>{t("poems.moon.title")}</em></h2>
      {now ? <MoonImage date={now} /> : <p className={styles.note}>{t("poems.moon.loading")}</p>}
      {children}
    </section>
    <section className={styles.skyTile} aria-labelledby="poem-sky-title">
      <div className={styles.skyHeading}><div><span className={styles.eyebrow}>{t("poems.sky.eyebrow")}</span><h2 id="poem-sky-title"><em>{t("poems.sky.title")}</em></h2></div><span aria-hidden="true">✧</span></div>
      <div className={styles.location}><label htmlFor="poem-sky-city">{t("poems.sky.location")}</label><select id="poem-sky-city" value={city.name} onChange={event => setCity(cities.find(item => item.name === event.target.value) ?? cities[0])}>{cities.map(item => <option key={item.name} value={item.name}>{t(`poems.city.${item.name.replaceAll(" ", "_")}`)}</option>)}</select></div>
      <p className={styles.date}>{now ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: city.zone }).format(now) : t("poems.sky.loading")}</p>
      <div ref={mapRef} className={styles.map} id="poem-star-map">
        {skyVisible ? <iframe loading="lazy" title={t("poems.sky.frame", { city: city.name })} src={embed} referrerPolicy="no-referrer" allowFullScreen /> : <span className={styles.note}>{t("poems.sky.loading")}</span>}
      </div>
      <p className={styles.note}>{t("poems.sky.note")}</p>
      <p className={styles.credit}>{t("poems.sky.help")} <a href={embed} target="_blank" rel="noreferrer">{t("poems.sky.open")}</a> · <a href="https://stellarium-web.org/" target="_blank" rel="noreferrer">{t("poems.sky.credit")}</a></p>
    </section>
  </aside>;
}
