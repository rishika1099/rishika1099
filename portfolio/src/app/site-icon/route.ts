import { serveIcon } from "@/lib/siteIcon";

export const runtime = "nodejs";

// The tab icon, and the icon an installed copy of the site uses.
export function GET() {
  return serveIcon("icon", "/icon-512.png");
}
