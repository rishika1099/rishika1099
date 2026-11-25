import { readPhotoBytes, readThumbnail, photoTag } from "@/lib/photos";
export const runtime = "nodejs";
const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif" };
export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  if (!/^[a-zA-Z0-9._-]+\.(jpe?g|png|webp|gif|avif)$/i.test(file)) return new Response("Bad request", { status: 400 });
  const size = new URL(request.url).searchParams.get("size");
  if (size && size !== "384" && size !== "768") return new Response("Bad size", { status: 400 });
  try {
    const bytes = size ? await readThumbnail(file, Number(size)) : await readPhotoBytes(file);
    if (!bytes) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(bytes), { headers: {
      "Content-Type": size ? "image/webp" : TYPES[file.split(".").pop()!.toLowerCase()],
      "Cache-Control": "public, max-age=60",
      "Netlify-CDN-Cache-Control": "public, max-age=86400, stale-while-revalidate=604800, durable",
      "Netlify-Cache-Tag": photoTag(file),
      "Netlify-Vary": "query=size",
    } });
  } catch { return new Response("Image unavailable", { status: 503 }); }
}
