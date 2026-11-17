"use client";
import { useEffect, useState } from "react";
import { cities, skyAt, starLines, gardenLight } from "@/lib/nightSky";
import MoonImage from "./MoonImage";
import styles from "./PoemSky.module.css";

export default function PoemSky() {
  const [now, setNow] = useState<Date | null>(null);
  const [city, setCity] = useState(cities[0]);
  const [interactive, setInteractive] = useState(false);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, []);
  const stars = now ? skyAt(now, city) : [];
  const daylight = now && gardenLight(now, city) !== "night";
  const embed = "https://virtualsky.lco.global/embed/index.html?" + new URLSearchParams({
    latitude: String(city.lat), longitude: String(city.lon), projection: "stereo",
    constellations: "true", constellationlabels: "true", showstarlabels: "true",
    live: "true", showdate: "true", showposition: "false", keyboard: "false",
    mouse: "true", gradient: "false", background: "#292a43", color: "#e6d7f5",
  });
  return <aside className={styles.bento} aria-label="A little moonlight and stargazing">
    <section className={styles.moonTile} aria-labelledby="moon-tile-title">
      <span className={styles.eyebrow}>a companion for your thoughts</span>
      <h2 id="moon-tile-title">Under the <em>same moon.</em></h2>
      {now ? <MoonImage date={now} /> : <p className={styles.note}>Finding the moon…</p>}
    </section>
    <section className={styles.skyTile} aria-labelledby="poem-sky-title">
      <div className={styles.skyHeading}><div><span className={styles.eyebrow}>a window into the universe</span><h2 id="poem-sky-title">A little <em>stargazing.</em></h2></div><span aria-hidden="true">✧</span></div>
      <div className={styles.location}><label htmlFor="poem-sky-city">Looking up from</label><select id="poem-sky-city" value={city.name} onChange={event => setCity(cities.find(item => item.name === event.target.value) ?? cities[0])}>{cities.map(item => <option key={item.name}>{item.name}</option>)}</select></div>
      <p className={styles.date}>{now ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: city.zone }).format(now) : "Finding the stars…"}</p>
      <div className={styles.map} id="poem-star-map">
        {interactive ? <iframe title={`Interactive live constellation map over ${city.name}`} src={embed} referrerPolicy="no-referrer" /> : <svg viewBox="0 0 260 260" role="img" aria-label={`Approximate bright stars above ${city.name} at the displayed time`}>
          <circle cx="130" cy="130" r="108" fill="#ffffff03" stroke="#ffffff24" />
          <circle cx="130" cy="130" r="65" fill="none" stroke="#ffffff0c" strokeDasharray="3 6" />
          <path d="M22 130H238M130 22V238" stroke="#ffffff0c" />
          {starLines.map(([a,b]) => { const start = stars.find(s => s.name === a); const end = stars.find(s => s.name === b); return start && end ? <line key={a+b} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#c4bbeb60" /> : null; })}
          {stars.map((star,index) => <g key={star.name}><circle cx={star.x} cy={star.y} r={index < 5 ? 2.4 : 1.7} fill="#fff0c8"><title>{star.name}</title></circle>{index < 3 && <text x={star.x+5} y={star.y-6} fill="#d3cce6" fontSize="8">{star.name}</text>}</g>)}
          <g fill="#c5bddb" fontSize="9" textAnchor="middle"><text x="130" y="14">N</text><text x="130" y="254">S</text><text x="10" y="133">E</text><text x="250" y="133">W</text></g>
        </svg>}
      </div>
      <button type="button" className={styles.explore} aria-pressed={interactive} aria-controls="poem-star-map" onClick={() => setInteractive(value => !value)}>{interactive ? "Return to the quiet sky" : "Explore the constellations ↗"}</button>
      <p className={styles.note}>{daylight ? "It's daylight there now. These are the stars behind the blue." : "Calculated for this moment. A sky chart, not a camera feed."}</p>
      {interactive ? <p className={styles.credit}>Drag to look around. <a href={embed} target="_blank" rel="noreferrer">Open full sky ↗</a> · <a href="https://virtualsky.lco.global/" target="_blank" rel="noreferrer">VirtualSky / LCO</a></p> : <p className={styles.credit}>Approximate bright-star positions, refreshed every minute.</p>}
    </section>
  </aside>;
}
