export async function GET() {
  try {
    const response = await fetch("https://dog.ceo/api/breeds/image/random", { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error();
    const data = await response.json();
    const image = new URL(data.message);
    if (data.status !== "success" || image.protocol !== "https:" || image.hostname !== "images.dog.ceo") throw new Error();
    return Response.json({ image: image.href }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Our little visitor is taking a nap. Try again." }, { status: 503 });
  }
}
