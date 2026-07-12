import { NextResponse } from "next/server";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const maxDuration = 60;

// Compiles LaTeX via texlive.net (the LaTeX project's public compile service,
// the same one behind learnlatex.org): full TeX Live, any package. Proxied
// here so the editor stays same-origin and the endpoint stays key-gated.
const CGI = "https://texlive.net/cgi-bin/latexcgi";
const MAX_TEX = 200_000; // ~200KB of source is plenty for a resume

export async function POST(request: Request) {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  try {
    const { tex } = (await request.json()) as { tex?: string };
    if (!tex?.trim()) return NextResponse.json({ error: "tex is required" }, { status: 400 });
    if (tex.length > MAX_TEX) return NextResponse.json({ error: "source too large" }, { status: 400 });

    const form = new FormData();
    form.append("filecontents[]", new Blob([tex], { type: "text/plain" }), "document.tex");
    form.append("filename[]", "document.tex");
    form.append("engine", "pdflatex");
    form.append("return", "pdf");

    const res = await fetch(CGI, { method: "POST", body: form, redirect: "follow" });
    const buf = Buffer.from(await res.arrayBuffer());

    // success redirects to a .pdf; failures redirect to the .log
    const isPdf = buf.subarray(0, 4).toString("latin1") === "%PDF";
    if (res.ok && isPdf) {
      return NextResponse.json({ ok: true, pdfBase64: buf.toString("base64") });
    }
    return NextResponse.json({ ok: false, log: buf.toString("utf8").slice(-8000) });
  } catch {
    return NextResponse.json(
      { ok: false, log: "the compile service didn't answer, try again in a moment?" },
      { status: 502 },
    );
  }
}
