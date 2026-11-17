export async function GET() {
  try {
    const response = await fetch("https://cataas.com/cat?json=true", { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error();
    const data = await response.json();
    const image = new URL(data.url, "https://cataas.com");
    if (typeof data.url !== "string" || image.protocol !== "https:" || image.hostname !== "cataas.com" || !image.pathname.startsWith("/cat/")) throw new Error();
    return Response.json({ image: image.href }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Our little visitor is taking a nap. Try again." }, { status: 503 });
  }
}
