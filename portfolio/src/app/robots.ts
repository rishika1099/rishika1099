import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // keep private/utility routes out of search results
      disallow: ["/api/", "/blog/poems", "/stats", "/edit", "/*/edit", "/atelier"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
