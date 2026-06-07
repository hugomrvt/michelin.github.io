# Michelin Open Source — Website

Source code for **[opensource.michelin.io](https://opensource.michelin.io)**, the
showcase website for **Michelin IS & Digital**'s open source commitment.

It is a static, single‑page site built with [Hugo](https://gohugo.io/) and
deployed to **GitHub Pages** via GitHub Actions.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local development](#local-development)
- [Building for production](#building-for-production)
- [Project structure](#project-structure)
- [Editing content](#editing-content)
- [Design system](#design-system)
- [JavaScript](#javascript)
- [Images](#images)
- [Deployment](#deployment)
- [Accessibility & SEO](#accessibility--seo)
- [Maintenance & known caveats](#maintenance--known-caveats)
- [Contributing](#contributing)
- [Legal](#legal)

---

## Tech stack

| Layer        | Choice |
|--------------|--------|
| Generator    | [Hugo](https://gohugo.io/) (static site generator) |
| Templating   | Go HTML templates (`layouts/`) |
| Content      | Markdown + inline HTML (`content/`) |
| Styling      | A small **design system** written in **SCSS** (`assets/scss/`), compiled by Hugo — see [Design system](#design-system) |
| Scripting    | Vanilla JavaScript (`assets/js/`), bundled by Hugo |
| Hosting      | GitHub Pages (custom domain via `CNAME`) |
| CI/CD        | GitHub Actions (`.github/workflows/deploy.yml`) |

There is **no Node/npm tooling** in this repository — no `package.json`, no
bundler. SCSS compilation and asset bundling (compile → concatenate → minify →
fingerprint) are done by **Hugo Pipes** alone.

## Prerequisites

- **Hugo extended** — *required*, because the design system is written in SCSS
  and compiled with `css.Sass` (libsass, built into the extended edition). The
  CI installs it via `extended: true` in the workflow.

Install Hugo: <https://gohugo.io/installation/>

```bash
hugo version   # must report "+extended"
```

## Local development

Start a live‑reload dev server:

```bash
hugo server
```

Then open <http://localhost:1313>.

Useful flags:

```bash
hugo server -D                    # also render draft content
hugo server --disableFastRender   # full rebuild on every change
```

## Building for production

```bash
hugo --minify
```

The generated site is written to `public/` (git‑ignored). You normally never
build by hand — the [deployment workflow](#deployment) does it for you.

## Project structure

```
.
├── hugo.toml                       # Site configuration (baseURL, title, params…)
├── CNAME                           # Custom domain: opensource.michelin.io
├── content/
│   ├── _index.md                   # Home page (Hero, Manifesto, Memberships, Projects)
│   └── legal-notice.md             # Legal notice page (/legal-notice)
├── layouts/
│   ├── _default/
│   │   ├── baseof.html             # Base skeleton + asset bundling pipeline
│   │   ├── index.html              # Home template (renders .Content)
│   │   └── single.html             # Single‑page template (legal notice, etc.)
│   └── partials/
│       ├── header/header.html      # Navigation + burger menu
│       └── footer/
│           ├── footer.html         # Footer (socials, legal link, copyright)
│           └── backtotop.html      # "Back to top" button markup
├── assets/
│   ├── scss/                       # Design system (SCSS, compiled by Hugo)
│   │   ├── main.scss               #   entry point (@import order)
│   │   ├── _functions.scss         #   fluid() clamp() generator
│   │   ├── _mixins.scss            #   visually-hidden, focus-ring, surface-card
│   │   ├── _tokens.scss            #   design tokens → :root custom properties
│   │   ├── _typography.scss        #   fluid type on existing utilities + hero
│   │   ├── _carousel.scss          #   swipeable carousel component
│   │   └── _utilities.scss         #   a11y helpers
│   ├── css/
│   │   └── vendor.css              # Legacy compiled Michelin design system
│   └── js/
│       ├── script.js               # Burger menu + back‑to‑top
│       └── carousel.js             # Swipeable carousel controller
├── static/images/                  # All images, served as‑is from /images/...
├── DESIGN_SYSTEM.md                # Design system reference
└── .github/workflows/deploy.yml    # Build & deploy to GitHub Pages
```

### How a page is assembled

1. `hugo.toml` provides global config and `[params]`.
2. A file in `content/` provides the page body (Markdown/HTML) and front matter.
3. `layouts/_default/baseof.html` wraps everything: it bundles the CSS and JS
   (see below), injects the `header` partial, the page `main` block, the
   `footer` partial, and the back‑to‑top button.
4. `index.html` / `single.html` emit `{{ .Content }}` into the `main` block.

> **Note** — `markup.goldmark.renderer.unsafe = true` is enabled in
> `hugo.toml`. This is required because the content files embed raw HTML
> (sections, grids, SVGs). Keep this in mind when editing content.

## Editing content

Content lives in `content/`. Each file starts with YAML front matter, then the
page body.

- **Home page** → `content/_index.md`
  Sections: `hero`, `#Manifesto`, `#Memberships`, `#Projects`. The header
  navigation links to these section anchors.
- **Legal notice** → `content/legal-notice.md`
  Uses `template: "single"` and `url: "/legal-notice"` in its front matter.

Common front‑matter keys: `title`, `Description`, `images` (social share image),
`template`, `url`, `headerFixed`.

## Design system

The design system is written in **SCSS** under `assets/scss/` and compiled by
Hugo (`css.Sass`, libsass). `baseof.html` then concatenates the legacy CSS with
the compiled output:

```
vendor.css  +  scss/main.scss → CSS   ⇒  concat → minify → fingerprint
   (legacy)        (design system, loaded last so it wins)
```

`main.scss` imports the partials in order:

| Partial | Role |
|---------|------|
| `_functions.scss` | `fluid($min, $max)` — generates `clamp()` values from a min/max (max = former desktop value). |
| `_mixins.scss`    | `visually-hidden`, `focus-ring`, `surface-card`. |
| `_tokens.scss`    | **Single source of truth.** Sass maps for the type/spacing scales, emitted as `:root` custom properties (colours, fluid type, fluid spacing, radii, motion, layout, z‑index). |
| `_typography.scss`| Applies the fluid type scale to the existing heading utilities + the hero. |
| `_carousel.scss`  | The swipeable **carousel** component (`.ds-carousel`). |
| `_utilities.scss` | Accessibility helpers (`visually-hidden`, `:focus-visible`, reduced‑motion). |

`vendor.css` is the legacy, pre‑compiled Michelin design system (≈3,200 lines),
kept as a **vendored asset** (edit directly and sparingly — there is no source
pipeline for it here). It is intentionally kept *out* of the SCSS pipeline.

**Why compile after vendor?** CSS custom properties resolve at use‑time. Because
`_tokens.scss` redefines `--spacing-*` (etc.) in a `:root` that lands *after*
`vendor.css`, every existing rule that already uses `var(--spacing-*)`
automatically becomes fluid — no need to touch the vendor rules.

**Fluid by design.** Spacing and typography use `clamp()` so the layout scales
smoothly between phone and desktop instead of jumping at breakpoints. Each
clamp's **maximum equals the previous fixed desktop value**, so large screens
render as before and only smaller screens scale down.

See **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** for the full token reference, the
type/spacing scales, component docs, and conventions.

## JavaScript

`assets/js/` holds plain, dependency‑free scripts, bundled by Hugo
(`concat → minify → fingerprint`):

- **`script.js`** — the back‑to‑top button and the mobile burger navigation.
- **`carousel.js`** — drives the swipeable carousels: prev/next buttons and
  click‑and‑drag on desktop. Touch swiping itself is native (CSS scroll‑snap),
  so no third‑party slider library is needed.

> A strict **Content‑Security‑Policy** is set in `baseof.html`
> (`script-src 'self'; object-src 'none'`). All JavaScript must be first‑party.
> Inline scripts and third‑party CDNs are blocked by design — which is exactly
> why the carousel is built in‑house.

## Images

All images live in `static/images/` and are referenced with absolute paths
(`/images/...`). Files under `static/` are copied verbatim — Hugo does **not**
process them.

**WebP optimization (applied).** The on‑page raster images are served as
**WebP**, which cut their combined weight by **~70%** (≈1.7 MB → ≈0.5 MB; e.g.
`couv` 667 KB → 155 KB, `fond` 317 KB → 36 KB). Conventions used:

- Each image was encoded both lossy (`q82`) and lossless; the **smaller** result
  wins, and WebP is only adopted when it actually beats the PNG (flat
  illustrations such as `Team`/`code`/`picto` use lossless).
- `favicon.png` (favicon compatibility) and `michelin-oss.jpg` (the Open Graph
  share image, for social‑platform compatibility) are intentionally **left as‑is**.
- SVGs (logos, icons) are vector and need no conversion.

> Regenerating: the WebP files were produced with `sharp` (libvips). Browser
> support for WebP is universal across evergreen browsers, so references point to
> `.webp` directly rather than using `<picture>` fallbacks. For a future, more
> Hugo‑idiomatic setup, move images into `assets/` and use
> [Hugo image processing](https://gohugo.io/content-management/image-processing/).

## Deployment

Deployment is automated by **`.github/workflows/deploy.yml`**:

- **Trigger:** push to `main` (or manual `workflow_dispatch`).
- **Build:** checks out the repo, installs Hugo, runs `hugo --minify`.
- **Deploy:** uploads `public/` as a Pages artifact and publishes it.

The custom domain `opensource.michelin.io` is configured via `CNAME`.

> Pushing to a feature branch does **not** deploy. Open a pull request and merge
> to `main` to publish. (No CI runs on PRs — only `main` triggers the workflow.)

## Accessibility & SEO

- Decorative images use empty/`aria-hidden`; meaningful images carry descriptive
  text (carousel logos expose their name via `role="img"` + `aria-label`).
- Carousel arrows are real `<button>`s with `aria-label`s and visible
  `:focus-visible` rings; `prefers-reduced-motion` is respected.
- The contact email in the header is obfuscated with HTML entities.
- `baseof.html` emits OpenGraph + Twitter cards, meta description, keywords,
  `robots`, viewport, theme color, favicon, and font `preconnect`s.
- `enableRobotsTXT = true` generates `robots.txt`.

## Maintenance & known caveats

- **`vendor.css` has no in‑repo source.** See [Design system](#design-system) —
  edit it directly; there is no build step to regenerate it here.
- **Fonts load from external CDNs** via `@font-face` in `vendor.css`
  (MichelinUnitTitling from Azure Blob, Noto Sans from Google Fonts). The CSP
  does not restrict fonts. `preconnect` hints are set for both hosts.
- **Images are WebP.** See [Images](#images) — on‑page rasters are optimized;
  `favicon.png` and the OG `michelin-oss.jpg` are kept in their original formats
  on purpose.
- **`unsafe` Markdown is required.** Content embeds raw HTML; disabling
  `markup.goldmark.renderer.unsafe` would break the pages.

## Contributing

1. Create a feature branch from `main`.
2. Make your changes and verify locally with `hugo server`.
3. Reuse design tokens (see [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)) instead of
   hard‑coded values; prefer `clamp()`/tokens over new breakpoints.
4. Open a pull request against `main`. Merging to `main` triggers the deploy.

## Legal

Content © Manufacture Française des Pneumatiques Michelin. See the
[legal notice](https://opensource.michelin.io/legal-notice) for full terms.
