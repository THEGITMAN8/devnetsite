# Agent guidance — DevNet site

This repository is the static landing site for DevNet (Developer Network). Changes should stay minimal and aligned with the existing flat structure.

## Stack

- **Markup**: `index.html` (single page).
- **Styles**: `style.css` plus Tailwind: source `input.css`, compiled output `tailwind-output.css` (see `tailwind.config.js`).
- **Script**: `main.js` for client behavior.
- **Deploy**: Vercel with framework preset **Other**, no build step in production that generates CSS unless you commit the output (see below). `vercel.json` defines security headers—preserve them when editing that file.

## Commands

From the repo root:

| Task | Command |
|------|---------|
| Install dev dependencies | `npm install` |
| Rebuild Tailwind CSS (required after changing Tailwind classes in `index.html` or layers in `input.css`) | `npm run build` |
| Watch mode while editing CSS | `npm run dev` |
| Local static preview | `npx serve .` (or open `index.html` directly) |

**Important:** If you add or change Tailwind utility classes in `index.html` or Tailwind-related rules in `input.css`, run `npm run build` and commit the updated `tailwind-output.css` so production matches local styling.

## Files to know

| Path | Role |
|------|------|
| `index.html` | Page structure and content; OG/Twitter meta references |
| `input.css` | Tailwind entry (`@tailwind` directives and custom layers) |
| `tailwind-output.css` | Generated CSS—commit when it changes |
| `tailwind.config.js` | Tailwind configuration |
| `style.css` | Additional non-Tailwind styles if used alongside generated CSS |
| `main.js` | Frontend JavaScript |
| `assets/og-image.png` | Social preview image; paths in meta tags should stay consistent with deployment URL (see README) |

## Conventions for edits

- Prefer editing existing files over adding new top-level assets unless necessary.
- Do not remove or weaken security headers in `vercel.json` without an explicit product decision.
- Keep `README.md` accurate when workflow or deploy steps change; this file focuses on **how agents should work in this repo**, not end-user docs.
- Avoid committing secrets; this is a public static site.

## Testing

There is no automated test suite. After substantive HTML/CSS/JS changes, rebuild CSS if needed and spot-check in a browser (layout, meta tags, console for errors).
