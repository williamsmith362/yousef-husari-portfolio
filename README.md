# Yousef Husari portfolio

The current approved portfolio is in [`logo-world/`](./logo-world/). It includes all 47 projects and 228 photographs, the scroll-to-logo animation, interactive garments, and the Simple vertical-scrolling view.

This version includes the larger inset name and navigation, iPhone canvas and catalogue improvements, more forgiving garment hitboxes, and the borderless close icon.

## Vercel

Deploy the `main` branch. The root `vercel.json` serves `logo-world` directly with no install or build step. The framework is Other.

An existing Vercel project whose Root Directory is already `logo-world` also works with the configuration inside that folder. No environment variables or backend are required.

## Local preview

From `logo-world`, run `python3 -m http.server 8000` and open `http://localhost:8000`.

## Previous version

The previous `main` is preserved on `backup/main-before-logo-v8-2026-11-08`. Older application source remains in the repository for reference; the active static website is `logo-world`.

The published website files match the approved preview runtime, including the final hover-target and photo-viewer close-button changes.
