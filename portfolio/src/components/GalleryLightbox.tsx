"use client";
import { useEffect, useRef } from "react";
import { useFeatureCopy } from "./FeatureCopy";
export default function GalleryLightbox({ src, caption, onClose }: { src: string; caption: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const t = useFeatureCopy();
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} className="fixed inset-0 m-auto max-h-[95dvh] max-w-[95vw] rounded-2xl bg-ink p-4 text-cream backdrop:bg-black/75" aria-label={caption}>
    <button autoFocus type="button" onClick={() => dialog.current?.close()} className="mb-3 block rounded-full border border-white/40 px-4 py-2">{t("photography.photo.close")}</button>
    {/* Only mounted after opening. Keep the original for full-detail viewing. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={src} alt={caption} width="1600" height="1200" className="h-auto max-h-[75dvh] w-auto max-w-full object-contain" />
    <p className="mt-3 text-center">{caption}</p>
  </dialog>;
}
