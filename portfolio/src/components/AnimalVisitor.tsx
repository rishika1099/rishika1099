"use client";
import Image from "next/image";
import { useFeatureCopy } from "./FeatureCopy";
import { useEffect, useState } from "react";
import styles from "./BlogPlayground.module.css";

type Visitor = { animal: string; width: number; height: number; image: string; caption: string; source: string; sourceUrl: string };
export default function AnimalVisitor({ animal }: { animal?: "cat" | "dog" }) {
  const t = useFeatureCopy();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [visit, setVisit] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(animal ? `/api/animal?animal=${animal}` : "/api/animal", { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const data: Visitor = await response.json();
      if (!controller.signal.aborted) { setVisitor(data); setBusy(false); }
    }).catch(() => { if (!controller.signal.aborted) { setBusy(false); setError("contact.animal.error"); } });
    return () => controller.abort();
  }, [visit, animal]);
  return <section className={`${styles.dog} ${styles.randomVisitor}`} aria-labelledby="animal-visitor-title">
    <div className={styles.dogPhoto}>
      {visitor ? <a href={visitor.sourceUrl} target="_blank" rel="noreferrer" aria-label={t("contact.animal.credit", { source: visitor.source })}><Image src={visitor.image} width={visitor.width} height={visitor.height} sizes="(max-width: 767px) calc(100vw - 72px), 280px" loading="lazy" decoding="async" alt={t("contact.animal.alt", { animal: visitor.animal })} onError={() => { setVisitor(null); setError("contact.animal.missing"); }} /></a> : <span aria-hidden="true">🐾</span>}
      <button className={styles.refreshPhoto} type="button" disabled={busy} aria-label={busy ? t("contact.animal.busy") : t("contact.animal.next")} title={t("contact.animal.next")} onClick={() => { setBusy(true); setError(""); setVisit(value => value + 1); }}><span aria-hidden="true">↻</span></button>
    </div>
    <h2 id="animal-visitor-title">{t("contact.animal.title")} <em>{t("contact.animal.hello")}</em></h2>
    {error && <p className={styles.photoError} role="status">{t(error)}</p>}
  </section>;
}
