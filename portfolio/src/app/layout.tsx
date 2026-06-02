import type { Metadata } from "next";
import { Nunito, Caveat, Cormorant_Garamond } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Nav from "@/components/Nav";
import AskMe from "@/components/AskMe";
import CursorCompanion from "@/components/CursorCompanion";
import CommandPalette from "@/components/CommandPalette";

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
  title: {
    default: "Rishika Mamidibathula",
    template: "%s · Rishika Mamidibathula",
  },
  description:
    "Data scientist & ML engineer in NYC. Projects, writing, poems, and photography, a little whimsical corner of the internet.",
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
        <AskMe />
        <CursorCompanion />
        <CommandPalette />
      </body>
    </html>
  );
}
