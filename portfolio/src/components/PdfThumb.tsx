"use client";

// A tidy thumbnail of a PDF attachment's first page, drawn to a canvas with
// PDF.js so there's no viewer chrome or black background, just the page on the
// card. Used for the certificate/diploma previews on About + its editors.

import { useEffect, useRef, useState } from "react";

export default function PdfThumb({ id, className = "" }: { id: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        const doc = await pdfjs.getDocument({ url: `/api/attachment/${id}` }).promise;
        if (cancelled) return;
        const page = await doc.getPage(1);
        const viewport = page.getViewport({ scale: 1.4 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
        if (!cancelled) setState("ready");
      } catch {
        if (!cancelled) setState("failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state === "failed") {
    return <span className={`flex items-center justify-center bg-white text-2xl ${className}`}>📄</span>;
  }
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`bg-white ${className} ${state === "loading" ? "opacity-0" : "opacity-100 transition-opacity"}`}
    />
  );
}
