import type { Metadata, Viewport } from "next";
import { SITE_URL } from "@/lib/siteUrl";
import {
  Nunito,
  Caveat,
  Cormorant_Garamond,
  Playfair_Display,
  Dancing_Script,
  Pacifico,
  Quicksand,
  Space_Mono,
} from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import CursorCompanion from "@/components/CursorCompanion";
import DeferredUI from "@/components/DeferredUI";
import MotionProvider from "@/components/MotionProvider";
import VisitPing from "@/components/VisitPing";
import Metrics from "@/components/Metrics";

const cattalague = localFont({
  src: "./fonts/Cattalague.ttf",
  variable: "--font-cattalague",
  display: "swap",
});

const halimun = localFont({
  src: "./fonts/Halimun.otf",
  variable: "--font-halimun",
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
// Both are declared here because the whole site can reach them, but neither is
// on most pages. next/font preloads by default, and a font declared in the root
// layout preloads on *every* route: Caveat is only ever painted on the
// photography and technical-blog pages, yet it was the single largest download
// on the homepage. preload: false leaves the @font-face in place and lets the
// browser fetch each face only on a page that actually paints with it, which
// for Cormorant also means fetching the italic without the upright.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  preload: false,
});
// Extra faces offered in the ink editor's font menu. `preload: false` matters:
// these exist for the editor's picker, but every visitor was downloading them
// on first paint, and the largest thing on the page is text waiting for fonts.
// Now the browser only fetches one if a passage actually uses it. One weight
// each, since a picker needs a face, not a family.
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["400"], preload: false });
const dancing = Dancing_Script({ variable: "--font-dancing", subsets: ["latin"], weight: ["400"], preload: false });
const pacifico = Pacifico({ variable: "--font-pacifico", subsets: ["latin"], weight: ["400"], preload: false });
const quicksand = Quicksand({ variable: "--font-quicksand", subsets: ["latin"], weight: ["400"], preload: false });
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400"], preload: false });

export const viewport: Viewport = {
  // tints the browser chrome on mobile to match the page rather than leaving a
  // slab of white above a cream site
  themeColor: "#fff8f0",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rishika Mamidibathula",
    template: "%s · Rishika Mamidibathula",
  },
  description:
    "Data scientist & ML engineer in NYC. Projects, writing, poems, and photography, a little whimsical corner of the internet.",
  keywords: [
    "Rishika Mamidibathula",
    "data scientist",
    "machine learning engineer",
    "LLM systems",
    "causal inference",
    "NYC",
    "Columbia University",
    "portfolio",
  ],
  authors: [{ name: "Rishika Mamidibathula" }],
  alternates: {
    // "./" is per route: each page is canonical to itself, not to the homepage
    canonical: "./",
    types: { "application/rss+xml": "/feed.xml" },
  },
  openGraph: {
    type: "website",
    siteName: "Rishika Mamidibathula",
    url: SITE_URL,
    title: "Rishika Mamidibathula",
    description:
      "Data scientist & ML engineer in NYC. Projects, writing, poems, and photography.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "Rishika Mamidibathula, Data Scientist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rishika Mamidibathula",
    description:
      "Data scientist & ML engineer in NYC. Projects, writing, poems, and photography.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${caveat.variable} ${cormorant.variable} ${cattalague.variable} ${halimun.variable} ${playfair.variable} ${dancing.variable} ${pacifico.variable} ${quicksand.variable} ${spaceMono.variable}`}
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          // Person structured data so search engines understand who this is
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Rishika Mamidibathula",
              url: SITE_URL,
              jobTitle: "Data Scientist & ML Engineer",
              alumniOf: "Columbia University",
              sameAs: [
                "https://github.com/rishika1099",
                "https://linkedin.com/in/rishika-mamidibathula",
                "https://rishika1099.substack.com",
              ],
            }),
          }}
        />
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-body focus:text-sm focus:font-semibold focus:text-ink focus:shadow-lg"
        >
          skip to content
        </a>
        <MotionProvider>
          <Nav />
          <main id="content" className="relative">{children}</main>
          <SiteFooter />
          <CursorCompanion />
          <DeferredUI />
        </MotionProvider>
        <VisitPing />
        <Metrics />
      </body>
    </html>
  );
}
