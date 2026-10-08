// Tell Netlify's CDN to drop what it has cached under a tag, so the next
// visitor gets the new version instead of a saved copy of the old one.
//
// The portrait is the case that needed it: it is cached at the edge and served
// stale while a fresh copy is fetched in the background, so the first load
// after an upload, which is always hers, showed the photo she had just replaced.
//
// The token and site id are provided by Netlify inside a deployed function.
// Anywhere else (her own machine) there is no CDN and this does nothing.

export async function purgeTag(tag: string): Promise<void> {
  const token = process.env.NETLIFY_PURGE_API_TOKEN;
  const site = process.env.SITE_ID;
  if (!token || !site) return;
  try {
    await fetch("https://api.netlify.com/api/v1/purge", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ site_id: site, cache_tags: [tag] }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    // the cached copy then expires on its own within a minute or two
  }
}
