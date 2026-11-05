# DevNet

Static site for [devnetwork.app](https://www.devnetwork.app). DevNet is a network of builders across 12 cities. The founding chapter is Western University in London.

## Stack

- Static HTML
- One stylesheet (`style.css`) and one script (`main.js`)
- Inter, self-hosted, weights 400, 500, and 700
- Inline SVG map, no map library
- Vercel (`vercel.json`: clean URLs, security headers, Content-Security-Policy)

## Pages

- `/` hero, About, DevNet network, Western chapter
- `/socials` network, Western chapter, and contact

## Local preview

```bash
npm install
npm run build
npx serve .
```

Open `/` and `/socials`.

## Logo

`assets/logo.webp` and `assets/logo.png` are the DN mark. Favicons and `assets/og-image.png` are generated from the same mark.
