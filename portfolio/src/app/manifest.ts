import type { MetadataRoute } from "next";

// Makes the site installable (Add to Home Screen / desktop PWA). Colors match
// the cream + ink palette so the splash screen feels like the rest of the site.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rishika Mamidibathula",
    short_name: "Rishika",
    description:
      "Data scientist & ML engineer in NYC. Projects, writing, poems, and photography, a little whimsical corner of the internet.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff8f0",
    theme_color: "#f7b7c9",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
