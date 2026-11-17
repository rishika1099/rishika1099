export async function GET(request: Request) {
  const stamp = new URL(request.url).searchParams.get("at");
  if (!stamp || !/^\d{4}-\d{2}-\d{2}T\d{2}:00$/.test(stamp)) {
    return Response.json({ error: "Invalid hour" }, { status: 400 });
  }
  const date = new Date(`${stamp}:00Z`);
  if (!Number.isFinite(date.getTime()) || Math.abs(date.getTime() - Date.now()) > 3 * 86400000) {
    return Response.json({ error: "Hour outside preview range" }, { status: 400 });
  }
  try {
    const response = await fetch(`https://svs.gsfc.nasa.gov/api/dialamoon/${stamp}`, {
      next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("NASA unavailable");
    const data = await response.json();
    const image = new URL(data.image.url);
    if (image.hostname !== "svs.gsfc.nasa.gov" || !["http:", "https:"].includes(image.protocol) || typeof data.phase !== "number") throw new Error("Unexpected image");
    image.protocol = "https:";
    return Response.json({ image: image.href, illumination: data.phase, approximate: false, at: stamp }, { headers: { "Cache-Control": "public, max-age=3600" } });
  } catch {
    // NASA's published 2026 hourly sequence remains usable if its API fails.
    // https://svs.gsfc.nasa.gov/5587/ (one-based frames, starting Jan 1 UTC)
    if (date.getUTCFullYear() === 2026) {
      const frame = String(Math.floor((date.getTime() - Date.UTC(2026, 0, 1)) / 3600000) + 1).padStart(4, "0");
      return Response.json({ image: `https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005587/frames/730x730_1x1_30p/moon.${frame}.jpg`, approximate: true, at: stamp }, { headers: { "Cache-Control": "public, max-age=300" } });
    }
    return Response.json({ error: "Moon imagery temporarily unavailable" }, { status: 503 });
  }
}
