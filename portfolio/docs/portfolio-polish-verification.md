# Portfolio polish verification

Implemented on feat/portfolio-polish-performance. No content sync or production writes.

## Image loading

The gallery disabled Next Image optimization with `unoptimized`, so 184 CSS pixel image windows fetched originals. Its existing fixed image windows already reserved space and Next Image already defaulted to lazy loading. The fix restores responsive optimization, adds explicit lazy loading and async decoding, and opens the original only in a native dialog after a click. Escape closes it and focus returns to the trigger.

Markdown images previously used the renderer's default img tag without responsive sizing, dimensions or lazy loading. Local Markdown images now use responsive Next Image output and reserved dimensions. Rich HTML images receive responsive attributes and lazy loading at render time, including old posts. Unknown external blog image hosts remain direct sources with lazy loading and reserved dimensions; they are not proxied through an unrestricted optimizer. Images without intrinsic author dimensions reserve a 3:2 contained frame.

The photo API already cached originals for one year. Since these filenames can be replaced, the change uses one day plus a week of stale-while-revalidate, adds an explicit Netlify CDN policy, and configures optimized-image caching for one day. Local public photos also get cache headers. Production Next Image responses were verified as `public, max-age=86400, must-revalidate`. Netlify edge cache behavior needs a deployed request to verify.

### Measured comparison

Eight local originals, compared with 384 pixel WebP thumbnails (appropriate for a roughly 184 pixel frame at 2x density), quality 75. Original total: 4,859,165 bytes. Optimized total: 184,104 bytes. Reduction: 96.2%.

A Chromium test downloaded each group concurrently from a local production build, with browser cache disabled, server transforms warm, 150 ms latency and 200,000 bytes/second throughput (1.6 Mbps): originals 24,546 ms, optimized 1,125 ms. These are image-transfer measurements, not whole-page LCP or production CDN timings. Cold local thumbnail generation took 20 to 37 ms; repeat requests took 1 to 2 ms.

| Image | Original bytes | Thumbnail bytes | Cold ms | Warm ms |
| --- | ---: | ---: | ---: | ---: |
| IMG_1271.jpg | 393573 | 9912 | 24 | 1 |
| IMG_1566.jpg | 600958 | 23112 | 24 | 1 |
| IMG_1805.jpg | 937173 | 38198 | 27 | 2 |
| IMG_1837.jpg | 609466 | 31424 | 27 | 1 |
| IMG_1838.jpg | 862735 | 40642 | 37 | 1 |
| IMG_1857.jpg | 606147 | 12246 | 20 | 1 |
| IMG_2041.jpg | 441319 | 15406 | 22 | 1 |
| IMG_2062.jpg | 407794 | 13164 | 21 | 1 |

## Editable feature copy

96 new registry entries, automatically included by the existing atelier copy endpoint and rendered in the matching authenticated edit rooms:

- Blog (8): door titles, numbered captions, solar-system caption, locked label.
- Poems (43): tagline, moon and sky headings, eyebrow text, loading states, phase names, illumination wording, NASA credit, city labels, planetarium note, controls hint, full-sky link, iframe accessibility label, password title, hint, placeholder, button, busy and error text.
- Contact (22): animal heading, species greetings, alt text, loading and errors, caption, next button and credits; guest wall heading, loading, sign button, busy, confirmation, errors and anonymous fallback. Existing guestbook form copy remains editable in its existing section.
- Photography (23): garden heading, intro, badge, flower names, count, empty/loading states, planting button and feedback, notes; photo open/close labels and untitled fallback.

The authenticated edit rooms and atelier loaded these entries. A local API save of the poems tagline appeared on the public page, then the exact original overrides file was restored. No production data was changed. Embedded third-party Stellarium controls are owned by Stellarium, not this copy registry.

## Appearance and behavior

- Pond: blue depth gradient, light rays, soft ripples, detailed veined lily pads and layered flowers. Ripple animation and fish motion stop with reduced motion.
- Poems: compact equal-height desktop tiles with Stellarium only; no quiet-sky toggle. Default tagline: The sky outside is part of the poetry inside.
- Animals: dogs and cats only, minimum 640x480 originals, no animation, bounded downloads, blur heuristic, responsive delivery. The heuristic rejects low-detail images but cannot guarantee photographic quality. Both current providers are species-specific and do not supply pandas or otters. Wikimedia Commons offers both with file-specific attribution; Some Random API documents pandas but does not guarantee resolution.
- Contact: first form row stays equal-width; visitor and public wall use one and three grid tracks. Notes wrap as individual cards with no enclosing panel. Phones stack the sections.
- Flower guestbook implemented after approval: 24 flowers per bed, mood-colored petals, accessible note dialog, plain list mode, and pagination. Photography now links to the Contact guestbook garden. Old standalone planting data remains preserved.

## Checks

- TypeScript: `npx tsc --noEmit` passed.
- ESLint on all changed/new TypeScript files: no errors; existing raw NASA img warning remains.
- Production build passed. Two existing dynamic-filesystem tracing warnings remain in attachments.ts and files.ts.
- 28 public routes and editor login screens returned 200 and had no document horizontal overflow at 390px.
- Four authenticated feature edit rooms and atelier checked at 390px, no overflow after fixing the nested save bar constraint.
- Gallery original loads only after click; Escape closes the dialog.
- Rich HTML image responsive and lazy attributes verified.
- Reduced-motion ripple animation names are all none.
- Desktop and phone screenshots captured for /blog/poems, /contact, and /blog.
- Local guestbook is empty. A temporary browser-only eight-entry fixture checks wrapping without adding public notes.

External sources: https://dog.ceo/dog-api/, https://cataas.com/, https://docs.some-random-api.com/endpoints/Animals, https://commons.wikimedia.org/wiki/Category:Ailuropoda_melanoleuca, https://commons.wikimedia.org/wiki/Category:Lutrinae.

## Flower guestbook follow-up

23 additional editable keys cover the garden controls, headings, feedback, mood labels and photography invitation. Hidden entries are filtered server-side; the public API is no-store, with refresh on focus and every minute. Existing moderation remains in the atelier.

Verified with temporary local fixtures: 25 visible entries paginate across two beds; one hidden entry is excluded; flower click and Enter open the matching note; Escape closes it and restores trigger focus; list mode renders the message. All fixtures were removed and the exact original local data restored. All 28 routes fit a 390px viewport after load. TypeScript, changed-file ESLint and the production build passed. Screenshots contain sample notes, not published entries.
