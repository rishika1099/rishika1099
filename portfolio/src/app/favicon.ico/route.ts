import { serveIcon } from "@/lib/siteIcon";

export const runtime = "nodejs";

// Browsers ask for this address whatever the page says, so it answers with the
// same icon. An uploaded one is a PNG, which every browser accepts here.
export function GET() {
  return serveIcon("icon", "/favicon-default.ico");
}
