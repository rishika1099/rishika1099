"use client";
import { useEffect, useState } from "react";
import styles from "./BlogPlayground.module.css";

type Visitor = { animal: string; image: string; caption: string; source: string; sourceUrl: string };
export default function AnimalVisitor() {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [visit, setVisit] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/animal", { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const data: Visitor = await response.json();
      if (!controller.signal.aborted) { setVisitor(data); setBusy(false); }
    }).catch(() => { if (!controller.signal.aborted) { setBusy(false); setError("Our little visitor is taking a nap. Try again."); } });
    return () => controller.abort();
  }, [visit]);
  return <section className={`${styles.dog} ${styles.randomVisitor}`} aria-labelledby="animal-visitor-title">
    <span className={styles.eyebrow}>a little visitor</span>
    <h2 id="animal-visitor-title">Someone says <em>{visitor?.caption ?? "hello."}</em></h2>
    <div className={styles.dogPhoto}>{visitor ? <img src={visitor.image} width="600" height="400" alt={`A ${visitor.animal} stopping by to say hello`} onError={() => { setVisitor(null); setError("This photo wandered off. Meet someone else?"); }} /> : <span aria-hidden="true">🐾</span>}</div>
    <p className={styles.dogCaption} role="status">{error || (busy ? "Finding a friendly face…" : `Today's visitor: a ${visitor?.animal}. Happy you're here.`)}</p>
    <div className={styles.dogFooter}><button type="button" disabled={busy} onClick={() => { setBusy(true); setError(""); setVisit(value => value + 1); }}>{busy ? "On the way…" : "Who’s next? ↻"}</button>{visitor && <a href={visitor.sourceUrl} target="_blank" rel="noreferrer">Photos: {visitor.source} ↗</a>}</div>
  </section>;
}
