import { serveIcon } from "@/lib/siteIcon";

export const runtime = "nodejs";
// read on every request: built once, it would serve the default for ever
export const dynamic = "force-dynamic";

// Browsers ask for this address whatever the page says, so it answers with the
// same icon. An uploaded one is a PNG, which every browser accepts here.
export function GET() {
  return serveIcon("icon", "/favicon-default.ico");
}
