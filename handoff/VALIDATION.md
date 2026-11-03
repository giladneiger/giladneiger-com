# Verification and handoff limits

Snapshot: 3 November 2026. Browser verification used headless Microsoft Edge on Windows, with the website's local fonts loaded.

## Checked

- Bento headlines: 11 viewport/height combinations from 320x640 through 1440x900; 88 expansion/filter states and 330 title measurements. No single-word lines, clipped titles or artwork/title intersections in those cases. Short-screen excerpts retain their own ellipsis instead of clipping a line in half. Original article titles remain available in the expanded state.
- Other main-page headings: 18 viewport widths from 320 to 1920. Actual rendered word positions were checked, including the chapter heading reported during review. Protected phrases and balanced wrapping keep the heading endings together. No single-word lines or horizontal heading overflow in those cases.
- Shared layout: centered containers, five real develeap article links, all expansion states, artwork/CTA clearance, header theme and local assets at 1440, 1024, 768 and 390 pixels.
- AI scroll scene: ordered build, readable hold, reversed disassembly, continuous frame closure, keyboard access, reversible scroll and reduced-motion flow.
- Direct mobile AI entry: 390x844, 375x667, 360x640, 430x932 and 844x390. Email/GO visible on arrival, native touch scroll in both directions, no unwanted autofocus and no horizontal overflow. Keyboard behavior was simulated by reducing the visual viewport; this is not a physical-device test.
- Inline weekly forms: mocked error, retry and success on homepage/archive, and isolation from the chapter/monthly form. No live HubSpot submission was made.
- Page entrances: typography retains its geometry after the word wrappers are inserted; visible content completes its entrance; keyboard focus is immediate; reduced motion bypasses animation.
- The final ZIP is verified by extraction and SHA-256 comparison against the staged files. The extracted website is smoke-tested on a separate preview port.

## Reproduce

Use the scripts in `qa/` after installing the optional Playwright dependency, as described in `README.md`. `QA_BASE_URL` can point to a different preview server; the default is http://127.0.0.1:5173. All scripts exit unsuccessfully on detected failures. Generated screenshots and reports go to `qa/results/`, which is excluded from this delivery.

`qa:headlines` checks bento titles. `qa:typography` checks the other main-page headings. These are measured viewport cases, not a claim that every browser, zoom level and possible viewport has been tested.

## Remaining production work

See the numbered connection list in `README.md`. In particular, the combined chapter/monthly form is still a demonstration and has no chapter-delivery automation. The weekly HubSpot endpoint is configured but live lead creation and email delivery are unverified. Older newsletter links still need permanent public URLs.

Production hosting, real Safari/iOS and Android devices, real keyboard behavior, real CRM delivery, conversion analytics, consent/privacy configuration and final book-purchase links remain the development team's release checks. No production deployment is included in this package.
