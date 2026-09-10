import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private/utility routes out of search results.
      //
      // The analytics room is deliberately not in this list. This file is
      // public, so every path named here is announced to anyone who reads it,
      // and that room is the one thing on the site whose existence should not
      // be. It carries a noindex of its own instead.
      disallow: ["/api/", "/blog/poems", "/edit", "/*/edit", "/atelier"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
