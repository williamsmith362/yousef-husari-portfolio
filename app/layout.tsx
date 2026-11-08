import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./gallery.css";
import SiteFooter from "../components/site-footer";
import { pageMetadata, siteName, siteOrigin } from "../lib/site-metadata";

export const metadata: Metadata = {
  ...pageMetadata(
    siteName,
    "Bespoke clothing and everyday objects by Yousef Husari. Independently designed, patterned, cut and sewn, with a focus on heavyweight denim and canvas.",
    "/",
  ),
  metadataBase: new URL(siteOrigin),
  applicationName: siteName,
  icons: {
    icon: [
      { url: "/favicon.ico?v=20261108", type: "image/x-icon", sizes: "16x16 32x32 48x48" },
      { url: "/branding/icon-16-20261108.png", type: "image/png", sizes: "16x16" },
      { url: "/branding/icon-32-20261108.png", type: "image/png", sizes: "32x32" },
      { url: "/branding/icon-48-20261108.png", type: "image/png", sizes: "48x48" },
      { url: "/branding/favicon-20261108.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: "/favicon.ico?v=20261108",
    apple: [
      { url: "/branding/apple-touch-icon-20261108.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: { "apple-mobile-web-app-title": siteName },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

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
