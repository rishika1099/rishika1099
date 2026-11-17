"use client";
import { useEffect, useState } from "react";
import styles from "./BlogPlayground.module.css";

export default function DogVisitor() {
  const [image, setImage] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [visit, setVisit] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/dog", { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json();
      setImage(data.image); setBusy(false);
    }).catch(() => { if (!controller.signal.aborted) { setBusy(false); setError("Our little visitor is taking a nap. Try again."); } });
    return () => controller.abort();
  }, [visit]);
  return <section className={styles.dog} aria-labelledby="dog-visitor-title">
    <span className={styles.eyebrow}>a very good distraction</span>
    <h2 id="dog-visitor-title">Someone says <em>hello.</em></h2>
    <div className={styles.dogPhoto}>{image ? <img src={image} width="360" height="270" alt="A dog stopping by the writing room" onError={() => { setImage(""); setError("This photo wandered off. Try another dog."); }} /> : <span aria-hidden="true">🐾</span>}</div>
    <p className={styles.dogCaption} role="status">{error || (busy ? "Finding a friendly face…" : "No thoughts. Just happy you're here.")}</p>
    <div className={styles.dogFooter}><button type="button" disabled={busy} onClick={() => { setBusy(true); setError(""); setVisit(value => value + 1); }}>{busy ? "On the way…" : "Another good dog ↻"}</button><a href="https://dog.ceo/dog-api/" target="_blank" rel="noreferrer">Photos: Dog CEO ↗</a></div>
  </section>;
}
