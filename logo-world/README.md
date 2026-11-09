# Yousef Husari — logo-world portfolio

The approved portfolio canvas, including all 47 projects and 228 photographs. Scroll to unfold, then drag or scroll to explore, pinch to zoom, and the scroll reveal ends on the supplied yh logo automatically. Project groups have varied photo sizes, larger main photographs, no captions, and no footer.

## Deploy on Vercel

- Repository: `williamsmith362/yousef-husari-portfolio`
- Branch: `portfolio-logo-world`
- Root Directory: `logo-world`
- Framework Preset: **Other**
- Build Command: **empty**
- Output Directory: **.**

The included `vercel.json` sets the framework, install, build and output options. No dependency installation, build step, environment variables or backend is needed. Import or configure this folder and deploy when ready.

Home, About and Contact are included locally. The contact page has the email link, copy-address button beside by.yousefhusar@gmail.com. Metadata is prepared for `https://www.yousefhusari.com`. The previous application remains at the repository root.

## Local preview

From this folder, run `python3 -m http.server 8000`, then open `http://localhost:8000`.

The view is deliberately minimal: no hints, captions, footer or visible canvas controls. Scrolling automatically zooms proportionally to a 30% smaller overview. The name and links are anchored to the board near the upper-left of the home area, moving and scaling with it while fading only with zoom. The cream utility group has tighter side offsets along the left curve; the mark remains skinny with closer photo spacing.

The canvas uses adaptive 192px previews and retains the 640px photographs for close viewing. Pointer and wheel painting is coalesced with requestAnimationFrame, unchanged visibility attributes are cached, and height-only browser-toolbar resizes avoid remeasuring the grid. The Contact page has no Gmail link.


The name and navigation are modestly larger. Simple, next to About, opens `/simple/`: the opening garment grid with normal vertical scrolling and the same full photo viewer. Fancy returns to the animated board.

After the logo forms, a normal cursor can lift each garment. Small alpha masks exclude transparent image space; stable base positions keep moving neighbours from stealing the hover. A critically damped spring coordinates scale and local displacement. The selected image stays within the viewport, the surrounding clothes yield with proximity, and motion stops once settled. A touch tap emphasizes a piece; a second tap opens its photos. Scrolling, dragging, resizing, losing focus or opening the viewer restores the composition. Reduced motion removes neighbour displacement and spring travel.


The home name and navigation are approximately 30% larger, with responsive sizing on narrow phones. Their board anchor is inset 48px on desktop and 32px on phones. The canvas computes the complete animation but only paints garment elements near the viewport, with an extra margin for smooth entry. Unchanged opacity and camera poses avoid repeated work.

The catalogue retains native horizontal touch scrolling and pinch zoom. It keeps at most five full photo elements on phones (seven on desktop), updates counters and accessibility only when the active slide changes, and caches slide geometry. Leaving the viewer releases its photo elements. Safari toolbar and viewport changes wait until the current swipe and momentum finish; the board no longer attempts to recenter a catalogue through an undefined variable during resizing.
