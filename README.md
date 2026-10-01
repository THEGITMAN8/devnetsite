# DevNet updated-site

A static, purple-themed marketing site for **DevNet**. DevNet sits between student-led chapters and individual members. **DevNet London** at Western University is the founding chapter.

This is a rebuild of the marketing site. Patterns for the Leaflet map were ported and slimmed down from the previous `main.js`.

## Stack

- Static HTML
- Tailwind CSS 3 (compiled to `tailwind-output.css`)
- Vanilla JS (`main.js`) + Leaflet 1.9.4 via CDN
- Hosted on Vercel (`vercel.json` does build + sets baseline security headers)

## Local development

```bash
npm install
npm run build          # one-shot Tailwind build
npm run dev            # watch mode
```

Then open `index.html` with a static server, e.g.:

```bash
npx serve .
```

`index.html` references `tailwind-output.css`, so you must run `npm run build` at least once before opening.

## Project layout

```
updated-site/
  index.html           # all 10 sections + nav + footer
  style.css            # purple theme, logo, cards, map popups
  main.js              # nav, scroll-spy, reveals, Leaflet map init
  data/chapters.js     # DevNet London chapter pin (founding chapter)
  input.css            # Tailwind entry
  tailwind.config.js   # devnet.* purple tokens
  tailwind-output.css  # generated, committed
  vercel.json          # build + security headers
  package.json
  assets/              # logo, favicon, og-image
  README.md
```

## Editing CTAs

All call-to-action URLs live in **one place** at the top of `main.js`:

```js
const CTA_LINKS = {
  joinDevNet: 'https://docs.google.com/forms/d/e/1FAIpQLSf-zY-pXzwldWrckCPpmdXvuXlvv-fNodLRm0zabNjaP1JdvA/viewform?usp=dialog',
  startChapter: 'https://docs.google.com/forms/d/e/1FAIpQLSfQ2YZFnGW_jo85EE1zla5nVDMlwmsz3wAoqt5cktMlDat7gQ/viewform?usp=dialog',
  submitProject: 'https://docs.google.com/forms/d/e/1FAIpQLSf29qweW0Zok2b_80z03ueYLMd-n5IwpmRxCCSU0UYOikyYGg/viewform?usp=dialog'
};
```

Update there to rotate links globally — the HTML reads from JS-injected hrefs on page load (no per-page sed/replace).

## Map data

Chapter pin data lives in `data/chapters.js`. The map shows **one campus chapter**: DevNet London at Western University, the founding chapter. Each entry has a `type` (`chapter` | `presence`) and a `status`:

| Status      | Color (purple family) | Meaning                                    |
| ----------- | --------------------- | ------------------------------------------ |
| `active`    | bright purple         | live campus chapter on the map               |
| `future`    | dashed slate          | reserved status; no future pin is listed   |
| `presence`  | dim purple            | network presence hub, if any are listed     |

The map opens centered on London. Edit `data/chapters.js` and re-run `npm run build` (no rebuild actually needed for the data file alone — it's loaded as a plain script — but rerun if you added new Tailwind classes).

## Logo

The on-site mark and browser icon come from the purple DN logo:

- `assets/devnet-logo.png` — source file
- `assets/logo.png` — display size used in the header, hero, and footer
- `assets/favicon.png`, `assets/favicon-16.png`, `assets/favicon-32.png`, `assets/favicon-48.png`, `assets/favicon.ico`, `assets/apple-touch-icon.png` — tab and home-screen icons

## Assets

Logo and icon files are listed under Logo above. `assets/og-image.png` is the social share image (1200x630 recommended).

## Deploy

`vercel.json` is preconfigured. Connect this folder as the Vercel project root and deploy; the build command runs `npm run build` and outputs to `.`.
