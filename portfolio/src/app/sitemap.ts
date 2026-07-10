import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

const BASE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    "",
    "/about",
    "/work",
    "/blog",
    "/blog/technical",
    "/blog/photography",
    "/blog/poems",
    "/contact",
  ];
  return routes.map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
