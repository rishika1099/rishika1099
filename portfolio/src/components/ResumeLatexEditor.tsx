"use client";

// An Overleaf-in-miniature for the resume: LaTeX source on the left, the
// compiled PDF on the right. Compilation runs on texlive.net (the LaTeX
// project's compile service, full TeX Live, any package) via a key-gated
// proxy. Saving persists the source and makes the compiled PDF what /resume
// serves.

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "@/components/editing";

type Status = "loading" | "ready" | "compiling" | "error";

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Draw the PDF onto canvases with PDF.js (like Overleaf does), so the preview
// works in any browser, no built-in PDF plugin needed. Returns the page count.
async function renderPdfToContainer(bytes: Uint8Array, container: HTMLDivElement): Promise<number> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  // pdf.js transfers the buffer to its worker, so hand it a copy
  const doc = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  container.innerHTML = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale: 2 }); // crisp on retina
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.className = "mb-3 w-full rounded-xl bg-white shadow";
    container.appendChild(canvas);
    await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise;
  }
  return doc.numPages;
}

export default function ResumeLatexEditor({ keyVal }: { keyVal: string }) {
  const api = adminApi(keyVal);
  const pdfB64Ref = useRef<string | null>(null);
  const pdfUrlRef = useRef<string | null>(null);
  const texRef = useRef("");
  const previewRef = useRef<HTMLDivElement>(null);

  const [tex, setTex] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [status, setStatus] = useState<Status>("loading");
  const [log, setLog] = useState("");
  const [showLog, setShowLog] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    texRef.current = tex;
  }, [tex]);

  const compile = useCallback(
    async (source: string) => {
      setStatus("compiling");
      setSaveMsg("");
      try {
        const r = await api<{ ok: boolean; pdfBase64?: string; log?: string }>(
          "/api/admin/resume-tex/compile",
          { method: "POST", body: JSON.stringify({ tex: source }) },
        );
        if (r.ok && r.pdfBase64) {
          pdfB64Ref.current = r.pdfBase64;
          const bytes = b64ToBytes(r.pdfBase64);
          // blob URL for "open ↗" / download
          const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
          const url = URL.createObjectURL(blob);
          if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
          pdfUrlRef.current = url;
          setPdfUrl(url);
          // paint the pages
          if (previewRef.current) {
            try {
              setPageCount(await renderPdfToContainer(bytes, previewRef.current));
            } catch {
              // canvas render failed; the open ↗ link still has the PDF
              setPageCount(0);
            }
          }
          setLog("");
          setStatus("ready");
          setDirty(false);
        } else {
          setLog(r.log || "compile failed with no log");
          setStatus("error");
          setShowLog(true);
        }
      } catch {
        setLog("the compile didn't go through, check your connection and try again?");
        setStatus("error");
        setShowLog(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // boot: fetch the saved source, then a first compile
  useEffect(() => {
    let cancelled = false;
    api<{ tex: string }>("/api/admin/resume-tex")
      .then(({ tex: source }) => {
        if (cancelled) return;
        setTex(source);
        compile(source);
      })
      .catch(() => {
        if (!cancelled) {
          setLog("couldn't load the saved source, refresh?");
          setStatus("error");
          setShowLog(true);
        }
      });
    return () => {
      cancelled = true;
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    if (!pdfB64Ref.current || dirty) {
      setSaveMsg("compile a clean PDF first ✦");
      return;
    }
    setSaveMsg("saving…");
    try {
      await api("/api/admin/resume-tex", {
        method: "POST",
        body: JSON.stringify({ tex: texRef.current, pdfBase64: pdfB64Ref.current }),
      });
      setSaveMsg("saved ✓ /resume now serves this");
    } catch {
      setSaveMsg("save failed, try again?");
    }
  }

  const busy = status === "loading" || status === "compiling";
  const statusLabel =
    status === "loading"
      ? "opening the desk…"
      : status === "compiling"
        ? "compiling…"
        : status === "error"
          ? "compile had errors"
          : "ready";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">📄 resume, in LaTeX</h1>
          <p className="mt-0.5 font-body text-sm text-ink-soft">
            edit the <code>.tex</code> on the left, watch the PDF on the right. save to make it the
            live resume at{" "}
            <Link href="/resume" className="underline decoration-blush/60" target="_blank">
              /resume
            </Link>
            .
          </p>
        </div>
        <Link href="/about/edit" className="font-body text-sm text-ink-soft hover:text-ink">
          ← back to about
        </Link>
      </div>

      {/* toolbar */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => compile(tex)}
          disabled={busy}
          className="rounded-full bg-ink px-5 py-2 font-body text-sm font-semibold text-cream transition hover:opacity-90 disabled:opacity-50"
        >
          {status === "compiling" ? "compiling…" : "▶ compile"}
        </button>
        <button
          onClick={save}
          disabled={busy || !pdfUrl || dirty}
          className="rounded-full bg-blush px-5 py-2 font-body text-sm font-semibold text-ink transition hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          💾 save as live resume
        </button>
        <span
          className={`font-body text-xs font-semibold ${
            status === "error" ? "text-rose-500" : "text-ink-soft"
          }`}
        >
          {statusLabel}
        </span>
        {pageCount > 0 && status === "ready" && (
          <span
            className={`rounded-full px-2.5 py-0.5 font-body text-xs font-semibold ${
              pageCount === 1 ? "bg-mint/60 text-ink" : "bg-gold/50 text-ink"
            }`}
            title={pageCount === 1 ? "fits on one page" : "spills past one page"}
          >
            {pageCount === 1 ? "1 page ✓" : `${pageCount} pages`}
          </span>
        )}
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="font-body text-xs font-semibold text-ink-soft underline decoration-dotted hover:text-ink"
          >
            open ↗
          </a>
        )}
        {dirty && status === "ready" && (
          <span className="font-body text-xs italic text-ink-soft/70">edited, recompile to update</span>
        )}
        {saveMsg && <span className="font-body text-xs text-ink-soft">{saveMsg}</span>}
        {log && (
          <button
            onClick={() => setShowLog((v) => !v)}
            className="ml-auto font-body text-xs text-ink-soft underline decoration-dotted hover:text-ink"
          >
            {showLog ? "hide log" : "show log"}
          </button>
        )}
      </div>

      {/* split pane */}
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <textarea
          value={tex}
          onChange={(e) => {
            setTex(e.target.value);
            setDirty(true);
          }}
          spellCheck={false}
          className="h-[70vh] w-full resize-none rounded-2xl border border-white/70 bg-white/90 p-4 font-mono text-[13px] leading-relaxed text-ink outline-none focus:border-blush focus:ring-2 focus:ring-blush/30"
          placeholder="\documentclass{article}…"
        />
        <div className="relative h-[70vh] w-full overflow-auto rounded-2xl border border-white/70 bg-ink/5 p-3">
          <div ref={previewRef} />
          {!pdfUrl && (
            <div className="flex h-full items-center justify-center p-6 text-center font-body text-sm text-ink-soft">
              {status === "error" ? "no PDF yet, see the log" : "compiling your first preview…"}
            </div>
          )}
        </div>
      </div>

      {showLog && log && (
        <pre className="mt-3 max-h-64 overflow-auto rounded-2xl bg-twilight/95 p-4 font-mono text-[11px] leading-relaxed text-[#f3eefe]">
          {log}
        </pre>
      )}

      <p className="mt-3 font-body text-xs text-ink-soft/70">
        Compiled with pdfLaTeX on texlive.net (the LaTeX project&apos;s compile service, full TeX
        Live, any package works). Paste in any resume template you like.
      </p>
    </div>
  );
}
