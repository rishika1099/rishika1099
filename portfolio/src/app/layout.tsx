import type { Metadata } from "next";
import { Nunito, Caveat, Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Nav from "@/components/Nav";
import SiteFooter from "@/components/SiteFooter";
import AskMe from "@/components/AskMe";
import CursorCompanion from "@/components/CursorCompanion";
import CommandPalette from "@/components/CommandPalette";
import VisitPing from "@/components/VisitPing";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://rishika-m.netlify.app"),
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
  openGraph: {
    type: "website",
    siteName: "Rishika Mamidibathula",
    url: "https://rishika-m.netlify.app",
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
      className={`${nunito.variable} ${caveat.variable} ${cormorant.variable} ${cattalague.variable} ${halimun.variable}`}
    >
      <body className="antialiased">
        <Nav />
        <main className="relative">{children}</main>
        <SiteFooter />
        <AskMe />
        <CursorCompanion />
        <CommandPalette />
        <VisitPing />
      </body>
    </html>
  );
}
