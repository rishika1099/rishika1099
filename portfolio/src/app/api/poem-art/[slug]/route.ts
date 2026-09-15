import { cookies } from "next/headers";
import { POEM_COOKIE, verifyToken } from "@/lib/auth";
import { ensurePoemArt } from "@/lib/poemArt";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const cookieStore = await cookies();
  if (!verifyToken(cookieStore.get(POEM_COOKIE)?.value)) {
    return new Response("Locked", { status: 401 });
  }

  const { slug } = await params;
  try {
    const png = await ensurePoemArt(slug);
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        // short cache (not immutable) so re-generated / restored art shows soon
        // Private: this is behind the poem password. "public" let a shared cache
        // (Netlify's CDN) keep a copy and hand it to someone without the cookie.
        "Cache-Control": "private, max-age=300",
        Vary: "Cookie",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "error";
    const status = msg === "Poem not found" ? 404 : 500;
    return new Response(msg, { status });
  }
}
