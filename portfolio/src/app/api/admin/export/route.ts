import { NextResponse } from "next/server";
import { SITE_HOST } from "@/lib/siteUrl";
import { adminConfigured, isAdmin } from "@/lib/adminAuth";
import { getCopy } from "@/lib/siteCopy";
import { listPoems } from "@/lib/poems-store";
import { getAboutEntries } from "@/lib/aboutData";
import { getContactLinks } from "@/lib/contactLinks";
import { listRichPosts } from "@/lib/richBlogs";
import { listPhotos } from "@/lib/photos";
import { getAllReactions } from "@/lib/reactions";
import { listGuestbookAll } from "@/lib/guestbook";

export const runtime = "nodejs";

// One-click backup of everything editable: a single JSON snapshot the owner can
// download and keep. Key-gated (nothing here is exposed publicly).
export async function GET(request: Request) {
  if (!adminConfigured()) return NextResponse.json({ error: "unconfigured" }, { status: 503 });
  if (!isAdmin(request)) return NextResponse.json({ error: "nope" }, { status: 401 });

  const [copy, poems, about, contact, blogs, photos, reactions, guestbook] = await Promise.all([
    getCopy(),
    listPoems(),
    getAboutEntries(),
    getContactLinks(),
    listRichPosts(),
    listPhotos().catch(() => []),
    getAllReactions(),
    listGuestbookAll(),
  ]);

  const snapshot = {
    exportedAt: new Date().toISOString(),
    site: SITE_HOST,
    copy,
    poems,
    about,
    contact,
    blogs,
    photos,
    reactions,
    guestbook,
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(snapshot, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="portfolio-backup-${stamp}.json"`,
    },
  });
}
