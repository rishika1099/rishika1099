import { serveIcon } from "@/lib/siteIcon";

export const runtime = "nodejs";
// read on every request: built once, it would serve the default for ever
export const dynamic = "force-dynamic";

// The large icon: what an installed copy of the site puts on a home screen.
// The browser tab uses the small one at /favicon.ico.
export function GET() {
  return serveIcon("icon", "/icon-512.png");
}
