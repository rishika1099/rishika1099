import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { blobsEnabled } from "./blobs";

async function variantStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore({ name: "image-variants", consistency: "strong" });
}

const directory = path.join(process.cwd(), "src/content/image-variants");
export async function readVariant(key: string): Promise<Buffer | null> {
  if (blobsEnabled()) {
    const value = await (await variantStore()).get(key, { type: "arrayBuffer" });
    return value ? Buffer.from(value) : null;
  }
  try { return await fs.readFile(path.join(directory, key)); } catch { return null; }
}
export async function writeVariant(key: string, bytes: Buffer) {
  if (blobsEnabled()) {
    await (await variantStore()).set(key, new Blob([new Uint8Array(bytes)]));
  } else {
    const file = path.join(directory, key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, bytes);
  }
}
export async function removeVariant(key: string) {
  if (blobsEnabled()) await (await variantStore()).delete(key);
  else await fs.rm(path.join(directory, key), { force: true });
}
export async function webVariant(bytes: Buffer, width: number, png = false, thumbnail = false) {
  const resized = sharp(bytes, { limitInputPixels: 40_000_000 }).rotate().resize({ width, height: thumbnail ? undefined : width, fit: "inside", withoutEnlargement: true });
  return png ? resized.png({ compressionLevel: 9 }).toBuffer() : resized.webp({ quality: 80 }).toBuffer();
}
export const thumbnailKey = (file: string, width: number) => `photos-v2/${file}-${width}.webp`;
export const displayKey = (kind: string) => `files-v1/${kind}`;
