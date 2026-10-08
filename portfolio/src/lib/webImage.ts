// iPhone photos arrive as HEIC, which only Safari can display. Every uploader
// passes its file through here first: a HEIC becomes a JPEG in the browser,
// before anything is sent, and every other file comes back untouched. So the
// site only ever stores formats all browsers can show.
//
// The decoder is large, so it is fetched only when a HEIC actually turns up.

/** Added to an uploader's accept list so the file picker offers iPhone photos. */
export const HEIC_ACCEPT = ".heic,.heif";

export function isHeic(file: File): boolean {
  // some browsers report no type at all for these, so the name counts too
  return /\.(heic|heif)$/i.test(file.name) || /^image\/hei[cf]/i.test(file.type);
}

// An iPhone photo is 12 to 48 megapixels, and as a JPEG that can pass the size
// a single upload is allowed to be. Nothing on the site shows a photo wider
// than this, so a larger one is scaled down to it.
const LONGEST_SIDE = 3000;

async function fitted(jpeg: Blob, side = LONGEST_SIDE): Promise<Blob> {
  const bitmap = await createImageBitmap(jpeg);
  const scale = side / Math.max(bitmap.width, bitmap.height);
  if (scale >= 1) {
    bitmap.close();
    return jpeg;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const small = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/jpeg", 0.88));
  return small ?? jpeg;
}

export async function webImage(file: File): Promise<File> {
  if (!isHeic(file)) return file;
  const { heicTo } = await import("heic-to");
  const blob = await fitted(await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 }));
  const name = file.name.replace(/\.(heic|heif)$/i, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
}

/**
 * A picture no larger than `side` on its longest edge, as a JPEG. For the
 * portrait, which is shown in a circle a few hundred pixels across and loads
 * first on the home page: a photo straight off a phone is twenty times the
 * bytes that circle can use.
 */
export async function smallImage(picked: File, side: number): Promise<File> {
  const file = await webImage(picked);
  if (!file.type.startsWith("image/")) return file;
  const blob = await fitted(file, side);
  if (blob === file) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
}
