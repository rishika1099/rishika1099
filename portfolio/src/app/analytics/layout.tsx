import type { Metadata } from "next";

// Kept out of search results by the page itself rather than by robots.txt.
//
// A Disallow line is an advertisement: robots.txt is public, so listing the
// path there tells anyone who reads it exactly where the private room is, and
// under the old name it was already doing that. noindex does the job the
// Disallow line was there for, and does it better, since a disallowed URL can
// still surface in results while a noindex one cannot.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
