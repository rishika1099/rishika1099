// The little picture in the browser tab, and on a phone's home screen.
//
// It used to be three files in the repo, so changing it meant a commit. Now an
// icon uploaded from /edit is served instead, and the otter that shipped with
// the site is what shows when nothing has been uploaded.
//
// The addresses carry no version, because the root layout names them and a
// layout that looked one up would make every page on the site render on
// demand. An upload purges the CDN's copy by tag instead; browsers hold on to
// tab icons longest of all, so a new one can take a refresh to show.

import { NextResponse } from "next/server";
import { readFileKind, type FileKind } from "@/lib/files";

export const ICON_TAG = "site-icon";

const HEADERS = {
  "Cache-Control": "public, max-age=300",
  "Netlify-CDN-Cache-Control": "public, max-age=300, stale-while-revalidate=86400, durable",
  "Netlify-Cache-Tag": ICON_TAG,
};

/** The uploaded icon if there is one, else the file that shipped with the site. */
export async function serveIcon(kind: FileKind, fallback: string) {
  const f = await readFileKind(kind);
  if (f) {
    return new NextResponse(new Uint8Array(f.buf), {
      headers: { "Content-Type": f.mime, ...HEADERS },
    });
  }
  // a relative Location, so it lands on whatever host the visitor asked
  return new NextResponse(null, { status: 307, headers: { Location: fallback, ...HEADERS } });
}
