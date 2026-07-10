import type { Metadata } from "next";
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
import AskMe from "@/components/AskMe";
import CursorCompanion from "@/components/CursorCompanion";
import CommandPalette from "@/components/CommandPalette";
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
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});
// extra faces offered in the ink editor's font menu
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["400", "600", "700"] });
const dancing = Dancing_Script({ variable: "--font-dancing", subsets: ["latin"], weight: ["400", "600", "700"] });
const pacifico = Pacifico({ variable: "--font-pacifico", subsets: ["latin"], weight: ["400"] });
const quicksand = Quicksand({ variable: "--font-quicksand", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const spaceMono = Space_Mono({ variable: "--font-space-mono", subsets: ["latin"], weight: ["400", "700"] });

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
        <Nav />
        <main className="relative">{children}</main>
        <SiteFooter />
        <AskMe />
        <CursorCompanion />
        <CommandPalette />
        <VisitPing />
        <Metrics />
      </body>
    </html>
  );
}
