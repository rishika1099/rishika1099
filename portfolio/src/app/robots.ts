import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // keep private/utility routes out of search results
      disallow: ["/api/", "/blog/poems", "/stats", "/edit", "/*/edit", "/atelier"],
    },
    sitemap: "https://rishika-m.netlify.app/sitemap.xml",
  };
}
