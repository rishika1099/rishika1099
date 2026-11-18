import sharp from "sharp";
import { randomInt } from "node:crypto";

const providers = [
  { animal: "dog", endpoint: "https://dog.ceo/api/breeds/image/random", field: "message", host: "images.dog.ceo", source: "Dog CEO", sourceUrl: "https://dog.ceo/dog-api/", caption: "woof." },
  { animal: "cat", endpoint: "https://cataas.com/cat?json=true", field: "url", host: "cataas.com", source: "CATAAS", sourceUrl: "https://cataas.com/", caption: "meow." },
];
export const runtime = "nodejs";
export async function GET() {
  const start = randomInt(providers.length);
  // Try another provider if the first visitor's photo service is unavailable.
  const deadline = AbortSignal.timeout(14000);
  for (let attempt = 0; attempt < 4; attempt++) {
    const provider = providers[(start + attempt) % providers.length];
    try {
      const response = await fetch(provider.endpoint, { cache: "no-store", signal: AbortSignal.any([deadline, AbortSignal.timeout(4000)]) });
      if (!response.ok) continue;
      const data = await response.json();
      if (typeof data[provider.field] !== "string") continue;
      const image = new URL(data[provider.field], provider.sourceUrl);
      if (image.hostname !== provider.host) continue;
      if (image.protocol === "http:") image.protocol = "https:";
      if (image.protocol !== "https:") continue;
      // Reject tiny or animated originals before they ever reach the card.
      // Bound the body as well as the request time, since these are third parties.
      const photo = await fetch(image, { signal: AbortSignal.any([deadline, AbortSignal.timeout(4000)]), redirect: "error" });
      if (!photo.ok || !photo.body) continue;
      const reader = photo.body.getReader();
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 8_000_000) { await reader.cancel(); break; }
        chunks.push(value);
      }
      if (bytes > 8_000_000) continue;
      const meta = await sharp(Buffer.concat(chunks), { limitInputPixels: 40_000_000 }).metadata();
      if (!meta.width || !meta.height || meta.width < 640 || meta.height < 480 || (meta.pages ?? 1) > 1) continue;
      const pixels = await sharp(Buffer.concat(chunks)).rotate().resize(320, 320, { fit: "cover" }).greyscale().raw().toBuffer();
      let detail = 0;
      // Edge energy rejects heavily blurred photos even when dimensions are large.
      for (let y = 1; y < 319; y++) for (let x = 1; x < 319; x++) {
        const i = y * 320 + x;
        const edge = 4 * pixels[i] - pixels[i-1] - pixels[i+1] - pixels[i-320] - pixels[i+320];
        detail += edge * edge;
      }
      if (detail / (318 * 318) < 50) continue;
      return Response.json({ width: meta.width, height: meta.height, animal: provider.animal, image: image.href, caption: provider.caption, source: provider.source, sourceUrl: provider.sourceUrl }, { headers: { "Cache-Control": "no-store" } });
    } catch { /* Try the next photo service. */ }
  }
  return Response.json({ error: "Our visitors are resting. Try again soon." }, { status: 503 });
}
