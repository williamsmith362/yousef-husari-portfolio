# yousef-husari-portfolio
Yousef Husari — bespoke clothing and objects portfolio

## Site branding

Page metadata is defined in `lib/site-metadata.ts` and exported through the Next.js App Router layouts and pages. Canonical URLs use the existing primary domain, `https://www.yousefhusari.com`.

The supplied handwritten yh mark is preserved as vector artwork in `public/branding/yousef-husari-logo.svg`. The favicon SVG adapts to light and dark browser themes; opaque PNGs and a multi-size ICO provide fallbacks. The opaque 180px Apple touch icon has a 116px centered mark and at least 32px padding. Saved Home Screen links use the name **Yousef Husari**.

The public 1200 × 630 sharing image is:

https://www.yousefhusari.com/branding/yousef-husari-social-20261108.png

It uses the supplied mark, the site's existing Playfair Display lettering, and the black-and-white palette. All three pages have individual titles, descriptions, canonical URLs, and complete Open Graph and social-card metadata, including image alt text.

There was no web-app manifest or service worker. Launch behavior is preserved. The branding folder also includes 192px and 512px square icons and a separate 512px maskable icon whose artwork fits inside the central 80% safe circle, ready for any future manifest.

Icon and preview filenames are versioned to refresh old caches. On a future redesign, create new filenames and update the metadata references. Existing Home Screen shortcuts may need to be removed and added again; social services control their own preview caches.
