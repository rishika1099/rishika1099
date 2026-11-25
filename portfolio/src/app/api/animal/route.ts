import { randomInt } from "node:crypto";

const providers = [
  { animal: "dog", endpoint: "https://dog.ceo/api/breeds/image/random", field: "message", host: "images.dog.ceo", source: "Dog CEO", sourceUrl: "https://dog.ceo/dog-api/", caption: "woof." },
  { animal: "cat", endpoint: "https://cataas.com/cat?json=true", field: "url", host: "cataas.com", source: "CATAAS", sourceUrl: "https://cataas.com/", caption: "meow." },
];
export const runtime = "nodejs";
export async function GET(request: Request) {
  const animal = new URL(request.url).searchParams.get("animal");
  const choices = animal === "cat" || animal === "dog" ? providers.filter(provider => provider.animal === animal) : providers;
  const start = randomInt(choices.length);
  // Try another provider if the first visitor's photo service is unavailable.
  const deadline = AbortSignal.timeout(14000);
  for (let attempt = 0; attempt < 4; attempt++) {
    const provider = choices[(start + attempt) % choices.length];
    try {
      const response = await fetch(provider.endpoint, { cache: "no-store", signal: AbortSignal.any([deadline, AbortSignal.timeout(4000)]) });
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
