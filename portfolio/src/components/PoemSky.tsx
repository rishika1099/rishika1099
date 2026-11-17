"use client";
import { useEffect, useState, type ReactNode } from "react";
import { cities } from "@/lib/nightSky";
import MoonImage from "./MoonImage";
import styles from "./PoemSky.module.css";

export default function PoemSky({ children }: { children?: ReactNode }) {
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
  return <aside className={styles.bento} aria-label="A little moonlight and stargazing">
    <section className={styles.moonTile} aria-labelledby="moon-tile-title">
      <span className={styles.eyebrow}>a companion for your thoughts</span>
      <h2 id="moon-tile-title">Under the <em>same moon.</em></h2>
      {now ? <MoonImage date={now} /> : <p className={styles.note}>Finding the moon…</p>}
      {children}
    </section>
    <section className={styles.skyTile} aria-labelledby="poem-sky-title">
      <div className={styles.skyHeading}><div><span className={styles.eyebrow}>a window into the universe</span><h2 id="poem-sky-title">A little <em>stargazing.</em></h2></div><span aria-hidden="true">✧</span></div>
      <div className={styles.location}><label htmlFor="poem-sky-city">Looking up from</label><select id="poem-sky-city" value={city.name} onChange={event => setCity(cities.find(item => item.name === event.target.value) ?? cities[0])}>{cities.map(item => <option key={item.name}>{item.name}</option>)}</select></div>
      <p className={styles.date}>{now ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: city.zone }).format(now) : "Finding the stars…"}</p>
      <div className={styles.map} id="poem-star-map">
        <iframe title={`Interactive Stellarium planetarium over ${city.name}`} src={embed} referrerPolicy="no-referrer" allowFullScreen />
      </div>
      <p className={styles.note}>A simulated sky. Explore constellations, atmosphere, and time using the controls.</p>
      <p className={styles.credit}>Drag to look around, scroll to zoom. <a href={embed} target="_blank" rel="noreferrer">Open full sky ↗</a> · <a href="https://stellarium-web.org/" target="_blank" rel="noreferrer">Stellarium Web</a></p>
    </section>
  </aside>;
}
