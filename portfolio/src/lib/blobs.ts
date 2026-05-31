/**
 * Private content (poems, poem art, photos, captions) lives in Netlify Blobs on
 * the deployed site, so it shows up live without ever being committed to the
 * public Git repo. Locally we read from the gitignored folders instead.
 *
 * Publish local folders to Blobs with `npm run sync`.
 */
export function blobsEnabled(): boolean {
  return !!(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);
}

export async function store(name: string) {
  const { getStore } = await import("@netlify/blobs");
  return getStore(name);
}
