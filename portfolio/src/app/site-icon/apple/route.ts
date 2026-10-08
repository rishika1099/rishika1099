import { serveIcon } from "@/lib/siteIcon";

export const runtime = "nodejs";
// read on every request: built once, it would serve the default for ever
export const dynamic = "force-dynamic";

// The icon an iPhone puts on its home screen: the same picture on a white
// ground, since iOS fills transparency with black.
export function GET() {
  return serveIcon("icon-apple", "/apple-icon-default.png");
}
