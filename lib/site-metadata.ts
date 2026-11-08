import type { Metadata } from "next";

export const siteName = "Yousef Husari";
export const siteOrigin = "https://www.yousefhusari.com";

const socialImage = {
  url: `${siteOrigin}/branding/yousef-husari-social-20261108.png`,
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "Yousef Husari's handwritten yh logo above the name Yousef Husari and the words Bespoke clothing & everyday objects on white.",
};

export function pageMetadata(
  title: string,
  description: string,
  pathname: "/" | "/about" | "/contact",
): Metadata {
  const url = new URL(pathname, siteOrigin).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName,
      title,
      description,
      url,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: socialImage.url, alt: socialImage.alt }],
    },
  };
}
