import type { NextConfig } from "next";

// Sent with every response. None of these touch how the site's own scripts or
// styles load, so none of them can break a page; each closes one door.
const securityHeaders = [
  // Nobody else can put the site in a frame, which is how clickjacking works:
  // an invisible atelier laid over a button on someone else's page. The site's
  // own frames (a PDF attachment opened in the lightbox) are same-origin and
  // still allowed.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // The same rule for browsers that read the newer header, plus three
  // directives that only ever matter to injected markup: no <base> pointing
  // links elsewhere, no plugins, no form posting its contents to another site.
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  // other sites see that a visitor came from rishika-m.com, never the full
  // address of the page they were on
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // the site uses none of these, so no page on it (or anything injected into
  // one) can ask for them
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "X-Content-Type-Options", value: "nosniff" },
];

const nextConfig: NextConfig = {
  // no "X-Powered-By: Next.js", which only helps someone matching the site to
  // a published vulnerability
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
