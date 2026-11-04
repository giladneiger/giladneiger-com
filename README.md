# Gilad Neiger website - development handoff

Snapshot: 3 November 2026. This is the current editable website and local preview, not a production deployment.

## Run locally

Install Node.js 20 or later, open a terminal in this folder, and run:

```sh
npm run dev
```

Open http://127.0.0.1:5173/. No dependency installation or build is needed to run the site. `server.cjs` is a development preview server. It supports optional `PORT` and `HOST` environment variables; defaults are port 5173 and loopback only.

## Deploy

Upload the **contents of `dist/`** as the document root of a static HTTPS host. Keep its directory structure. `dist/` contains the editable HTML, CSS, JavaScript and assets; it is not a generated framework bundle. There is no server rendering, database, build step or SPA fallback requirement.

Serve `.html`, `.css`, `.js`, `.svg`, `.webp`, fonts and `.pdf` with their standard MIME types. This snapshot uses unversioned file names, so use revalidation or short caching for HTML/CSS/JS until the development team adds cache versioning. Deploy at the domain root; a subdirectory deployment requires reviewing root-relative URLs in the archive and legacy article reader.

| Entry point | Purpose |
| --- | --- |
| `/` | Main site, with hero B as default |
| `/#ai-in-the-loop` | Campaign landing directly at the weekly signup; normal scrolling continues in both directions |
| `/#articles` | Gilad's articles, not book chapters |
| `/#chapter` | Combined first chapter + monthly Team Talk offer |
| `/newsletters.html` | Archive of 31 AI in the Loop editions |
| `/newsletters/issue-31.html` | Local reading copy of the latest imported issue |
| `/newsletters/ai-in-the-loop-2026-10-29.pdf` | Downloadable latest imported issue |
| `/?hero=A` | Preserved alternative hero effect, without comparison controls |

## Connections to finish before production

1. **First chapter + The Team Talk:** `chapter-signup.js` submits email directly to HubSpot portal `25695560`, form `aa85f8e0-c6f0-41f9-97c7-fd28818759b5`, without navigating away. Names remain optional in HubSpot and are not collected by the website. Publish the HubSpot form changes and finish the separate Team Talk subscription/list and chapter email automation. Success confirms receipt only, not delivery or subscription. Keep the setup notice until a live end-to-end check passes. Chapter PDF: https://25695560.fs1.hubspotusercontent-eu1.net/hubfs/25695560/One-Nil%20Down/chapter-01.pdf
2. **AI in the Loop:** the homepage and archive already share the inline email-only HubSpot handler in `weekly-signup.js`. It targets portal `25695560`, form `b54058f1-90e9-401c-9052-7b482d71f06e`. Error, retry and success were tested with intercepted requests. Real lead creation, consent configuration and email delivery still require a controlled end-to-end check by the team. QA scripts do not submit live leads.
3. **Older newsletter links:** With Gilad’s approval, editions 1–30 and the two older-issue homepage cards temporarily use the original HubSpot preview URLs. Tomer will replace them directly in this repository with permanent public web-version URLs. Preview links may require authentication or become unavailable. Edition 31 remains available locally. The archive is a static import, not an automatic HubSpot sync.
4. **Book purchase:** The Amazon button links directly to https://www.amazon.com/dp/9655963926.
5. **Speaking:** the form opens a `mailto:` draft. Confirm `gilad.neiger@develeap.com` and keep this intentional, or connect the desired delivery endpoint.
6. **Campaign attribution:** there is no conversion analytics or UTM-to-CRM mapping. The current weekly form sends `origin + pathname` as `pageUri`. Add campaign attribution if needed.

No production publication or live signup was performed for this handoff.

## Editing map

| Files | Responsibility |
| --- | --- |
| `dist/index.html` | Page structure, copy, signup markup, homepage newsletter cards |
| `dist/style.css`, `editorial-layout.css` | Base styles, section layout, bento and title sizing |
| `dist/articles.js`, `app.js` | Five real articles, chronological filters, inline expanding bento, chapter and speaking form behavior |
| `dist/hero-net-b.js`, `motion.js` | Default reactive net, retained hero A and portrait effects |
| `dist/loop-world.js`, `loop-world.css`, `loop-journey.css` | Dark AI scene, scroll assembly/disassembly, direct campaign entry |
| `dist/page-motion.js`, `page-motion.css` | Section and typographic entrances; reduced-motion behavior |
| `dist/weekly-signup.js` | Shared inline weekly HubSpot form handler |
| `dist/newsletters.html`, `newsletter-archive.js`, `newsletter-archive.css`, `newsletter-issues.js` | Newsletter archive and issue data |
| `dist/newsletters/` | Latest reading copy, PDF and its local image assets |
| `dist/assets/`, `fonts.css` | Brand artwork and local website fonts |

Bento cards use short editorial titles while collapsed and the complete original titles when expanded. Font sizes respond to the actual card width, with balanced wrapping and protected final word pairs. All five main article links lead to the original develeap articles. `article.html?id=...` remains a legacy local summary/source-link reader.

The latest imported newsletter is dated 29 October 2026. Its local reading copy removes scripts, tracking parameters and personalized preference/unsubscribe links from the original email. Its font stylesheet still references a public HubSpot font CDN; the main website's fonts are local. Archive card titles are in English and newsletter content is in Hebrew.

Original editable brand design: https://www.figma.com/design/Nr0FXkt43eKVdBAbfKk98q/Gilad-Neiger---Brand

## Optional browser QA

Install the pinned test dependency and Chromium once:

```sh
npm install
npx playwright install chromium
```

Keep the development server running on port 5173 in another terminal, then use:

```sh
npm run qa:headlines
npm run qa:typography
npm run qa:layout
npm run qa:scroll
npm run qa:mobile
npm run qa:forms
npm run qa:motion
```

`PLAYWRIGHT_CHANNEL=msedge` can select installed Edge. The default uses Playwright Chromium. `QA_BASE_URL` can override the preview URL. Tests write screenshots and reports into `qa/results/`. Signup requests are mocked. See `handoff/VALIDATION.md` for the verification scope and its limits.
