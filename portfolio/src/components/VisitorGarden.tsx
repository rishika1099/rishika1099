"use client";
import { useEffect, useState } from "react";
import styles from "./VisitorGarden.module.css";

type Flower = { id: string; kind: number; x: number; at: string };
const colors = ["#f1b5ce", "#e8d2ff", "#f5dc99"];
const flowerNames = ["pink cosmos", "lavender daisy", "golden buttercup"];

function Blossom({ kind }: { kind: number }) {
  return <svg viewBox="0 0 40 76" aria-hidden="true"><path d="M20 73 Q23 44 20 22 M21 55 Q2 35 8 56 Q14 62 21 59 M21 46 Q38 29 34 47 Q29 53 21 50" fill="#83a98b" stroke="#83a98b" strokeWidth="2" />{Array.from({length: 6},(_,i)=><ellipse key={i} cx="20" cy="12" rx={kind === 2 ? 7 : 5} ry="10" fill={colors[kind]} transform={`rotate(${i*60} 20 23)`} />)}<circle cx="20" cy="23" r="5" fill="#ffe8a7" /></svg>;
}

export default function VisitorGarden() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [kind, setKind] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("A little patch of internet, grown together.");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/garden", { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json();
      setFlowers(data.flowers); setLoaded(true);
    }).catch(() => { if (!controller.signal.aborted) setMessage("The garden couldn't load. Refresh to try again."); });
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
      setMessage("A little flower from you. The garden is happier already.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Couldn't plant. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className={styles.garden} aria-labelledby="visitor-garden-title">
    <div className={styles.heading}><span className={styles.eyebrow}>a little guestbook, in bloom</span><span className={styles.live}><i /> grown by visitors</span></div>
    <div className={styles.gardenIntro}><h2 id="visitor-garden-title">Leave a little <em>life behind.</em></h2><p>You wandered through my photographs. Plant a flower to say you were here.</p></div>
    <div className={styles.meadow}>
      <span className={styles.meadowNote}>{loaded ? flowers.length ? `${flowers.length} little ${flowers.length === 1 ? "hello" : "hellos"} growing here` : "The first flower could be yours" : "Opening the garden…"}</span>
      <div className={styles.hill} /><span className={styles.butterfly} aria-hidden="true">🦋</span>
      {flowers.map((flower,i)=><div className={styles.flower} key={flower.id} style={{left:`${flower.x}%`,bottom:`${12+(i%4)*7}px`,width:`${31+(i%3)*5}px`,animationDelay:`${i%5*-0.7}s`}} title={`A visitor planted ${flowerNames[flower.kind]}`}><Blossom kind={flower.kind} /></div>)}
    </div>
    <div className={styles.toolbar}><div className={styles.picker} role="group" aria-label="Choose a flower">{flowerNames.map((name,i)=><button key={name} type="button" aria-label={name} aria-pressed={kind===i} className={kind===i?styles.selected:""} onClick={()=>setKind(i)}><Blossom kind={i}/></button>)}</div><button type="button" className={styles.plant} disabled={busy || !loaded} onClick={plant}>{busy?"Taking root…":"Plant a little flower"}<span aria-hidden="true"> ↗</span></button><p role="status">{message}</p></div>
    <div className={styles.footnote}>These flowers belong to everyone who stopped by. <span>The garden shows the latest 80 flowers.</span></div>
  </section>;
}
