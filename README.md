# DevNet

Static site for [devnetwork.app](https://www.devnetwork.app). DevNet is a network of builders across 12 cities. The founding chapter is Western University in London.

## Stack

- Static HTML
- One stylesheet (`style.css`) and one script (`main.js`)
- Inter, self-hosted, weights 400, 500, and 700
- Network map stays on screen. Set `data-network="globe"` on `.map-board` to swap in the vendored cobe 0.6.5 globe (phenomenon 1.6.0, no CDN)
- Scroll motion: GSAP 3.13.0 and ScrollTrigger 3.13.0, vendored in `vendor/` (standard license, no CDN, no smooth-scroll)
- Share cards: `assets/og-home.png`, `assets/og-western.png`, `assets/og-socials.png` (1200×630)
- Vercel (`vercel.json`: clean URLs, security headers, Content-Security-Policy with `script-src 'self'`)

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
