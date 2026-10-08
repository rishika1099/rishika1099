import { serveIcon } from "@/lib/siteIcon";

export const runtime = "nodejs";

// The icon an iPhone puts on its home screen: the same picture on a white
// ground, since iOS fills transparency with black.
export function GET() {
  return serveIcon("icon-apple", "/apple-icon-default.png");
}
