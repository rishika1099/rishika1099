import { isAdmin } from "@/lib/adminAuth";
import { readArt, type Variant } from "@/lib/poemArtStore";

export const runtime = "nodejs";

// Serves a poem's art variant (active / draft / saved) for the editing UI.
// Admin-gated via the ?key= param so it can be used directly as an <img src>.
export async function GET(request: Request, ctx: { params: Promise<{ slug: string }> }) {
  if (!isAdmin(request)) return new Response("nope", { status: 401 });
  const { slug } = await ctx.params;
  const url = new URL(request.url);
  const v = url.searchParams.get("variant") ?? "active";
  const id = url.searchParams.get("id") ?? "";
  const variant: Variant = v === "draft" ? "draft" : v === "saved" ? { saved: id } : "active";

  try {
    const png = await readArt(slug, variant);
    if (!png) return new Response("not found", { status: 404 });
    return new Response(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("error", { status: 500 });
  }
}
