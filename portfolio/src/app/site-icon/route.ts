import { serveIcon } from "@/lib/siteIcon";

export const runtime = "nodejs";
// read on every request: built once, it would serve the default for ever
export const dynamic = "force-dynamic";

// The tab icon, and the icon an installed copy of the site uses.
export function GET() {
  return serveIcon("icon", "/icon-512.png");
}
