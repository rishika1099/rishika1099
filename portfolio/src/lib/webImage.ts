// Every uploader passes its file through here before anything is sent.
//
// Two things can be wrong with a picture as it comes off a device, and both
// are put right in the browser:
//
//   It is a HEIC. iPhone photos are, and only Safari can display them, so one
//   becomes a JPEG and the site only ever stores formats every browser shows.
//
//   It is too big. An upload travels inside one request, and the host refuses
//   a request over 6 MB; a photo straight off a camera passes that easily and
//   used to fail with nothing to say why. A picture over the limit is scaled
//   to a size nothing on the site exceeds, and saved as a JPEG.
//
// Anything else (a small image, a PDF) comes back untouched.

/** Added to an uploader's accept list so the file picker offers iPhone photos. */
export const HEIC_ACCEPT = ".heic,.heif";

// Nothing on the site shows a photo wider than this.
const LONGEST_SIDE = 3000;
// Base64 makes a file a third larger in transit, so this is what fits in 6 MB
// with room for the rest of the request.
const MAX_BYTES = 4 * 1024 * 1024;

export function isHeic(file: File): boolean {
  // some browsers report no type at all for these, so the name counts too
  return /\.(heic|heif)$/i.test(file.name) || /^image\/hei[cf]/i.test(file.type);
}

const toJpeg = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", quality));

/**
 * The picture as a JPEG no longer than `side` on its longest edge and no
 * heavier than the upload limit. Null if this browser cannot decode it.
 */
async function redraw(source: Blob, side: number): Promise<Blob | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source);
  } catch {
    return null;
  }
  const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return null;
  }
  // a transparent PNG would otherwise turn black where it was clear
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of [0.88, 0.8, 0.7]) {
    const out = await toJpeg(canvas, quality);
    if (out && out.size <= MAX_BYTES) return out;
  }
  return toJpeg(canvas, 0.6);
}

const renamed = (file: File, blob: Blob) =>
  new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });

async function fromHeic(file: File, side: number): Promise<File> {
  // Safari reads HEIC itself, which is quicker and far lighter on a phone than
  // running a decoder; every other browser falls through to the decoder, which
  // is large and so is fetched only now that it is needed.
  const native = await redraw(file, side);
  if (native) return renamed(file, native);
  const { heicTo } = await import("heic-to");
  const jpeg = await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
  return renamed(file, (await redraw(jpeg, side)) ?? jpeg);
}

/**
 * The file as the site can take it. `side` caps the longest edge; without it a
 * picture is only touched when it is a HEIC or over the upload limit.
 */
export async function webImage(file: File, side?: number): Promise<File> {
  if (isHeic(file)) return fromHeic(file, side ?? LONGEST_SIDE);
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  if (side === undefined && file.size <= MAX_BYTES) return file;
  const out = await redraw(file, side ?? LONGEST_SIDE);
  // already small enough in both senses: keep the original, untouched
  if (!out || (out.size >= file.size && file.size <= MAX_BYTES)) return file;
  return renamed(file, out);
}

/**
 * A picture no larger than `side` on its longest edge. For the portrait, which
 * is shown in a circle a few hundred pixels across and loads first on the home
 * page: a photo straight off a phone is twenty times the bytes that circle can
 * use.
 */
export const smallImage = (file: File, side: number) => webImage(file, side);
