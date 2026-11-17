import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { blobsEnabled, store } from "@/lib/blobs";
import { allowVisitor } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const directory = path.join(process.cwd(), "src/content/garden");
type Flower = { id: string; kind: number; x: number; at: string };

export async function GET() {
  try {
    let flowers: Flower[];
    if (blobsEnabled()) {
      const garden = await store("visitor-garden");
      const { blobs } = await garden.list();
      const recent = blobs.sort((a,b) => b.key.localeCompare(a.key)).slice(0,80);
      flowers = (await Promise.all(recent.map(b => garden.get(b.key, { type: "json" }) as Promise<Flower | null>))).filter((f): f is Flower => !!f);
    } else {
      await mkdir(directory, { recursive: true });
      const files = (await readdir(directory)).filter(f => f.endsWith(".json")).sort().reverse().slice(0,80);
      flowers = await Promise.all(files.map(async f => JSON.parse(await readFile(path.join(directory,f),"utf8"))));
    }
    return Response.json({ flowers }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "The garden is resting. Try again soon." }, { status: 503 });
  }
}
export async function POST(request: Request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Choose a flower first." }, { status: 400 }); }
  if (!body || !Number.isInteger(body.kind) || body.kind < 0 || body.kind > 2) return Response.json({ error: "Choose a flower first." }, { status: 400 });
  if (!(await allowVisitor(request,"garden",6,300,86400))) return Response.json({ error: "The garden has had plenty of love today. Come back tomorrow." }, { status: 429 });
  try {
    const flower: Flower = { id: `${Date.now()}-${randomUUID()}`, kind: body.kind, x: 8 + Math.random()*73, at: new Date().toISOString() };
    if (blobsEnabled()) await (await store("visitor-garden")).setJSON(flower.id,flower);
    else {
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory,`${flower.id}.json`),JSON.stringify(flower));
    }
    return Response.json({ flower }, { status: 201 });
  } catch { return Response.json({ error: "Your flower couldn't take root. Please try again." }, { status: 503 }); }
}
