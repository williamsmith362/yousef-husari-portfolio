import type { Metadata } from "next";
import "./globals.css";
import "./gallery.css";
import SiteFooter from "../components/site-footer";

export const metadata: Metadata = {
  title: "Yousef Husari",
  description: "An independent archive of bespoke clothing and objects. Designed, patterned, cut and sewn by Yousef Husari.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}<SiteFooter /></body>
    </html>
  );
}
