"use client";
import { useFeatureCopy } from "./FeatureCopy";
import { useEffect, useState } from "react";
import styles from "./VisitorGarden.module.css";

type Flower = { id: string; kind: number; x: number; at: string };
const colors = ["#f1b5ce", "#e8d2ff", "#f5dc99"];

function Blossom({ kind }: { kind: number }) {
  return <svg viewBox="0 0 40 76" aria-hidden="true"><path d="M20 73 Q23 44 20 22 M21 55 Q2 35 8 56 Q14 62 21 59 M21 46 Q38 29 34 47 Q29 53 21 50" fill="#83a98b" stroke="#83a98b" strokeWidth="2" />{Array.from({length: 6},(_,i)=><ellipse key={i} cx="20" cy="12" rx={kind === 2 ? 7 : 5} ry="10" fill={colors[kind]} transform={`rotate(${i*60} 20 23)`} />)}<circle cx="20" cy="23" r="5" fill="#ffe8a7" /></svg>;
}

export default function VisitorGarden() {
  const t = useFeatureCopy();
  const flowerNames = [t("photography.garden.pink"), t("photography.garden.lavender"), t("photography.garden.gold")];
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [kind, setKind] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("photography.garden.intro");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/garden", { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json();
      setFlowers(data.flowers); setLoaded(true);
    }).catch(() => { if (!controller.signal.aborted) setMessage("photography.garden.error"); });
    return () => controller.abort();
  }, []);
  async function plant() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/garden",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setFlowers(f => [data.flower,...f].slice(0,80));
      setMessage("photography.garden.success");
    } catch { setMessage("photography.garden.failed"); }
    finally { setBusy(false); }
  }
  return <section className={styles.garden} aria-labelledby="visitor-garden-title">
    <div className={styles.heading}><span className={styles.eyebrow}>{t("photography.garden.eyebrow")}</span><span className={styles.live}><i /> {t("photography.garden.badge")}</span></div>
    <div className={styles.gardenIntro}><h2 id="visitor-garden-title"><em>{t("photography.garden.title")}</em></h2><p>{t("photography.garden.caption")}</p></div>
    <div className={styles.meadow}>
      <span className={styles.meadowNote}>{loaded ? flowers.length ? t("photography.garden.count", { count: flowers.length }) : t("photography.garden.empty") : t("photography.garden.loading")}</span>
      <div className={styles.hill} /><span className={styles.butterfly} aria-hidden="true">🦋</span>
      {flowers.map((flower,i)=><div className={styles.flower} key={flower.id} style={{left:`${flower.x}%`,bottom:`${12+(i%4)*7}px`,width:`${31+(i%3)*5}px`,animationDelay:`${i%5*-0.7}s`}} title={t("photography.garden.planted", { flower: flowerNames[flower.kind] })}><Blossom kind={flower.kind} /></div>)}
    </div>
    <div className={styles.toolbar}><div className={styles.picker} role="group" aria-label={t("photography.garden.choose")}>{flowerNames.map((name,i)=><button key={name} type="button" aria-label={name} aria-pressed={kind===i} className={kind===i?styles.selected:""} onClick={()=>setKind(i)}><Blossom kind={i}/></button>)}</div><button type="button" className={styles.plant} disabled={busy || !loaded} onClick={plant}>{busy?t("photography.garden.busy"):t("photography.garden.button")}<span aria-hidden="true"> ↗</span></button><p role="status">{t(message)}</p></div>
    <div className={styles.footnote}>{t("photography.garden.note")} <span>{t("photography.garden.limit")}</span></div>
  </section>;
}
