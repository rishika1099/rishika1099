// Gate for the secret /edit room's write APIs. The key lives only in env
// (ADMIN_KEY locally and on Netlify), never in the repo.

export function isAdmin(request: Request): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected) return false;
  const given =
    request.headers.get("x-admin-key") ??
    new URL(request.url).searchParams.get("key") ??
    "";
  return given === expected;
}

export function adminConfigured(): boolean {
  return !!process.env.ADMIN_KEY;
}
