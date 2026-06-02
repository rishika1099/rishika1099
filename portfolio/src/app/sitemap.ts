import type { MetadataRoute } from "next";

const BASE = "https://rishika-m.netlify.app";

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
