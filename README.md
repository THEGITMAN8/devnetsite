# DevNet updated-site

A static, purple-themed marketing site for **DevNet** — a developer network of student-led campus chapters across North America.

This is a **greenfield** rebuild that lives alongside `Live-devnetsite/` (the green production site) and is **not** a fork of it. Patterns for the Leaflet presence map were ported and slimmed down from the live `main.js`.

## Stack

- Static HTML
- Tailwind CSS 3 (compiled to `tailwind-output.css`)
- Vanilla JS (`main.js`) + Leaflet 1.9.4 via CDN
- Hosted on Vercel (`vercel.json` does build + sets baseline security headers)

## Local development

```bash
cd updated-site
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
  style.css            # purple theme, hero D/N, cards, map popups
  main.js              # nav, scroll-spy, reveals, Leaflet map init
  data/chapters.js     # 13 network presence hubs (0 chapter pins on map)
  input.css            # Tailwind entry
  tailwind.config.js   # devnet.* purple tokens
  tailwind-output.css  # generated, committed
  vercel.json          # build + security headers
  package.json
  assets/              # favicon, og-image (drop in your files here)
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

Chapter and presence pin data lives in `data/chapters.js`. The map lists **3 campus chapters** (London, Halifax, Guelph) and **10 presence hubs** (5 Canada, 5 US). Each entry has a `type` (`chapter` | `presence`) and a `status`:

| Status      | Color (purple family) | Meaning                                    |
| ----------- | --------------------- | ------------------------------------------ |
| `active`    | bright purple         | live campus chapter on the map               |
| `future`    | dashed slate          | planned chapter on the roadmap             |
| `presence`  | dim purple            | network presence hub (city, builders)        |

Edit `data/chapters.js` and re-run `npm run build` (no rebuild actually needed for the data file alone — it's loaded as a plain script — but rerun if you added new Tailwind classes).

## Assets

`assets/` is empty by default. Drop in:

- `assets/favicon.png`
- `assets/og-image.png` (1200x630 recommended)

If absent, the page still renders — the favicon `<link>` will simply 404.

## Deploy

`vercel.json` is preconfigured. Connect this folder as the Vercel project root and deploy; the build command runs `npm run build` and outputs to `.`.
