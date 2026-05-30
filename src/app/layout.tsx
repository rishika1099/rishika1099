import type { Metadata } from "next";
import { Fredoka, Nunito, Caveat, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
  title: "Rishika Mamidibathula — Portfolio",
  description:
    "Data scientist & ML engineer in NYC. Projects, writing, poems, and photography — a little whimsical corner of the internet.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${fredoka.variable} ${nunito.variable} ${caveat.variable} ${cormorant.variable} antialiased`}
      >
        <Nav />
        <main className="relative">{children}</main>
      </body>
    </html>
  );
}
