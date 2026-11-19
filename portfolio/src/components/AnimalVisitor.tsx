"use client";
import Image from "next/image";
import { useFeatureCopy } from "./FeatureCopy";
import { useEffect, useState, type ReactNode } from "react";
import layout from "./ContactLayout.module.css";
import styles from "./BlogPlayground.module.css";

type Visitor = { animal: string; width: number; height: number; image: string; caption: string; source: string; sourceUrl: string };
export default function AnimalVisitor({ compact = false, animal, children }: { compact?: boolean; animal?: "cat" | "dog"; children?: ReactNode }) {
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
  if (compact) return <div className={layout.companion}>
    <div className={layout.portrait}>{visitor ? <Image src={visitor.image} width={visitor.width} height={visitor.height} sizes="112px" alt={t("contact.animal.alt", { animal: visitor.animal })} onError={() => { setVisitor(null); setError("contact.animal.missing"); }} /> : <span aria-hidden="true">🐾</span>}</div>
    <div className={layout.companionText}>{children}
      <div className={layout.companionActions}>
        <button type="button" disabled={busy} onClick={() => { setBusy(true); setError(""); setVisit(value => value + 1); }}>{busy ? t("contact.animal.busy") : t("contact.animal.next")}</button>
        {visitor && <a href={visitor.sourceUrl} target="_blank" rel="noreferrer">{t("contact.animal.credit", { source: visitor.source })}</a>}
      </div>
      {error && <p role="status" className={layout.companionError}>{t(error)}</p>}
    </div>
  </div>;
  return <section className={`${styles.dog} ${styles.randomVisitor}`} aria-labelledby="animal-visitor-title">
    <span className={styles.eyebrow}>{t("contact.animal.eyebrow")}</span>
    <h2 id="animal-visitor-title">{t("contact.animal.title")} <em>{t(`contact.animal.${visitor?.animal ?? "hello"}`)}</em></h2>
    <div className={styles.dogPhoto}>{visitor ? <Image src={visitor.image} width={visitor.width} height={visitor.height} sizes="(max-width: 767px) calc(100vw - 80px), 280px" loading="lazy" decoding="async" alt={t("contact.animal.alt", { animal: visitor.animal })} onError={() => { setVisitor(null); setError("contact.animal.missing"); }} /> : <span aria-hidden="true">🐾</span>}</div>
    <p className={styles.dogCaption} role="status">{(error && t(error)) || (busy ? t("contact.animal.loading") : t("contact.animal.caption", { animal: visitor?.animal ?? "" }))}</p>
    <div className={styles.dogFooter}><button type="button" disabled={busy} onClick={() => { setBusy(true); setError(""); setVisit(value => value + 1); }}>{busy ? t("contact.animal.busy") : t("contact.animal.next")}</button>{visitor && <a href={visitor.sourceUrl} target="_blank" rel="noreferrer">{t("contact.animal.credit", { source: visitor.source })}</a>}</div>
  </section>;
}
