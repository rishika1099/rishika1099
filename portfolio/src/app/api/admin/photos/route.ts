import { NextResponse } from "next/server";
import OpenAI from "openai";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { listPhotos, removePhoto, setCaption, writePhoto } from "@/lib/photos";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const EXT_RE = /\.(jpe?g|png|webp)$/i;

function guard(request: Request): NextResponse | null {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });
  return null;
}

// journal-style caption, same voice as the batch pipeline
async function autoCaption(dataUrl: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) return "";
  try {
    const openai = new OpenAI();
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      max_tokens: 40,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Write one short, warm, journal-style caption for this photo (under 12 words, lowercase, no quotes, no em dashes).",
            },
            { type: "image_url", image_url: { url: dataUrl, detail: "low" } },
          ],
        },
      ],
    });
    return res.choices[0]?.message?.content?.trim().replace(/^"|"$/g, "") ?? "";
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  return NextResponse.json({ photos: await listPhotos() });
}

export async function POST(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as { name?: string; dataBase64?: string };
    const name = (body.name ?? "").trim().replace(/[^a-zA-Z0-9._-]/g, "_");
    const b64 = body.dataBase64 ?? "";
    if (!name || !EXT_RE.test(name)) {
      return NextResponse.json({ error: "name must end in .jpg/.png/.webp" }, { status: 400 });
    }
    const buf = Buffer.from(b64, "base64");
    if (!buf.length || buf.length > MAX_BYTES) {
      return NextResponse.json({ error: "image missing or over 8MB" }, { status: 400 });
    }
    await writePhoto(name, buf);
    const mime = name.toLowerCase().endsWith(".png")
      ? "image/png"
      : name.toLowerCase().endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";
    const caption = await autoCaption(`data:${mime};base64,${b64}`);
    if (caption) await setCaption(name, caption);
    return NextResponse.json({ ok: true, name, caption });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  try {
    const { name } = (await request.json()) as { name?: string };
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    await removePhoto(name.split("/").pop()!);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "bad-request" }, { status: 400 });
  }
}
