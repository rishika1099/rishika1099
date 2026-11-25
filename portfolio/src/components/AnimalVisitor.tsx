"use client";
import { getImageProps } from "next/image";
import { useFeatureCopy } from "./FeatureCopy";
import { useEffect, useRef, useState } from "react";
import styles from "./BlogPlayground.module.css";

type Visitor = { animal: string; width: number; height: number; image: string; caption: string; source: string; sourceUrl: string };
export default function AnimalVisitor({ animal }: { animal?: "cat" | "dog" }) {
  const t = useFeatureCopy();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const advance = useRef<() => void>(() => {});
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let advancing = false;
    async function load(): Promise<Visitor | null> {
      try {
        for (let attempt = 0; attempt < 3 && active; attempt++) {
          const response = await fetch(animal ? `/api/animal?animal=${animal}` : "/api/animal", { signal: controller.signal });
          if (!response.ok) continue;
          const data: Visitor = await response.json();
          // Preload exactly the URL displayed, so refresh reuses decoded bytes.
          const { props } = getImageProps({ src: data.image, width: 320, height: 320, alt: "", quality: 75 });
          const image = new window.Image();
          image.src = props.src;
          let timer: ReturnType<typeof setTimeout> | undefined;
          try {
            await Promise.race([
              image.decode(),
              new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Image timed out")), 10_000); }),
            ]);
          } catch { image.src = ""; continue; }
          finally { clearTimeout(timer); }
          if (!active) return null;
          if (image.naturalWidth < 320 || image.naturalHeight < 240) continue;
          return { ...data, image: props.src, width: image.naturalWidth, height: image.naturalHeight };
        }
      } catch { /* Keep the last visitor when a provider is unavailable. */ }
      return null;
    }
    let next = load();
    const showNext = async () => {
      if (advancing || !active) return;
      advancing = true;
      setBusy(true);
      setError("");
      const data = await next;
      if (!active) return;
      if (data) setVisitor(data);
      else setError("contact.animal.error");
      setBusy(false);
      advancing = false;
      next = load();
    };
    advance.current = () => { void showNext(); };
    void showNext();
    return () => { active = false; controller.abort(); advance.current = () => {}; };
  }, [animal]);
  return <section className={`${styles.dog} ${styles.randomVisitor}`} aria-labelledby="animal-visitor-title">
    <div className={styles.dogPhoto}>
      {visitor ? <a href={visitor.sourceUrl} target="_blank" rel="noreferrer" aria-label={t("contact.animal.credit", { source: visitor.source })}>{/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={visitor.image} width={visitor.width} height={visitor.height} loading="lazy" decoding="async" alt={t("contact.animal.alt", { animal: visitor.animal })} onError={() => { setVisitor(null); setError("contact.animal.missing"); }} /></a> : <span className={styles.photoPlaceholder} aria-hidden="true">🐾</span>}
      <button className={styles.refreshPhoto} type="button" disabled={busy} aria-label={busy ? t("contact.animal.busy") : t("contact.animal.next")} title={t("contact.animal.next")} onClick={() => advance.current()}><span aria-hidden="true">↻</span></button>
    </div>
    <h2 id="animal-visitor-title">{t("contact.animal.title")} <em>{t("contact.animal.hello")}</em></h2>
    {error && <p className={styles.photoError} role="status">{t(error)}</p>}
  </section>;
}
