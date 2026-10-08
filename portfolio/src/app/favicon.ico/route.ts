import { serveIcon } from "@/lib/siteIcon";

export const runtime = "nodejs";
// read on every request: built once, it would serve the default for ever
export const dynamic = "force-dynamic";

// The icon in the browser tab. Every new visitor fetches it, so an uploaded one
// is served at tab size, a few kilobytes, not at the size a home screen wants.
// It is a PNG, which every browser accepts at this address.
export function GET() {
  return serveIcon("icon-small", "/favicon-default.ico");
}
