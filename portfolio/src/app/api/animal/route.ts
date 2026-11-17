import { randomInt } from "node:crypto";

const providers = [
  { animal: "dog", endpoint: "https://dog.ceo/api/breeds/image/random", field: "message", host: "images.dog.ceo", source: "Dog CEO", sourceUrl: "https://dog.ceo/dog-api/", caption: "woof." },
  { animal: "cat", endpoint: "https://cataas.com/cat?json=true", field: "url", host: "cataas.com", source: "CATAAS", sourceUrl: "https://cataas.com/", caption: "meow." },
  { animal: "fox", endpoint: "https://randomfox.ca/floof/", field: "image", host: "randomfox.ca", source: "RandomFox", sourceUrl: "https://randomfox.ca/", caption: "hello, slyly." },
  { animal: "duck", endpoint: "https://random-d.uk/api/v2/random?type=jpg", field: "url", host: "random-d.uk", source: "Random-d.uk", sourceUrl: "https://random-d.uk/api", caption: "quack." },
];
export const runtime = "nodejs";
export async function GET() {
  const start = randomInt(providers.length);
  // Try another provider if the first visitor's photo service is unavailable.
  for (let attempt = 0; attempt < 2; attempt++) {
    const provider = providers[(start + attempt) % providers.length];
    try {
      const response = await fetch(provider.endpoint, { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (!response.ok) continue;
      const data = await response.json();
      if (typeof data[provider.field] !== "string") continue;
      const image = new URL(data[provider.field], provider.sourceUrl);
      if (image.hostname !== provider.host) continue;
      if (image.protocol === "http:") image.protocol = "https:";
      if (image.protocol !== "https:") continue;
      return Response.json({ animal: provider.animal, image: image.href, caption: provider.caption, source: provider.source, sourceUrl: provider.sourceUrl }, { headers: { "Cache-Control": "no-store" } });
    } catch { /* Try the next photo service. */ }
  }
  return Response.json({ error: "Our visitors are resting. Try again soon." }, { status: 503 });
}
