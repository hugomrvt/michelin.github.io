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
- [Styling](#styling)
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
| Styling      | A single pre‑compiled stylesheet, `assets/css/out.css` (see [Styling](#styling)) |
| Scripting    | Vanilla JavaScript, `assets/js/script.js` |
| Hosting      | GitHub Pages (custom domain via `CNAME`) |
| CI/CD        | GitHub Actions (`.github/workflows/deploy.yml`) |

There is **no Node/npm tooling** in this repository — no `package.json`, no
bundler, no CSS build step. Everything is driven by Hugo alone.

## Prerequisites

- **Hugo** — the CI uses the latest release. The site uses Hugo Pipes
  (`resources.Minify`, `resources.Fingerprint`) on plain CSS/JS, so the
  **extended** edition is *not* required, but it works fine and is a safe
  default.

Install Hugo: <https://gohugo.io/installation/>

```bash
hugo version   # confirm Hugo is on your PATH
```

## Local development

Start a live‑reload dev server:

```bash
hugo server
```

Then open <http://localhost:1313>.

Useful flags:

```bash
hugo server -D            # also render draft content
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
│   │   ├── baseof.html             # Base HTML skeleton (<head>, header, main, footer)
│   │   ├── index.html              # Home template (renders .Content)
│   │   └── single.html             # Single‑page template (legal notice, etc.)
│   └── partials/
│       ├── header/header.html      # Navigation + burger menu
│       └── footer/
│           ├── footer.html         # Footer (socials, legal link, copyright)
│           └── backtotop.html      # "Back to top" button markup
├── assets/
│   ├── css/out.css                 # Pre‑compiled stylesheet (see Styling)
│   └── js/script.js                # Burger menu + back‑to‑top behaviour
├── static/
│   └── images/                     # All images, served as‑is from /images/...
└── .github/workflows/deploy.yml    # Build & deploy to GitHub Pages
```

### How a page is assembled

1. `hugo.toml` provides global config and `[params]`.
2. A file in `content/` provides the page body (Markdown/HTML) and front matter.
3. `layouts/_default/baseof.html` wraps everything: it injects the minified CSS,
   the `header` partial, the page `main` block, the `footer` partial, the
   back‑to‑top button, and the fingerprinted JS bundle.
4. `index.html` / `single.html` simply emit `{{ .Content }}` into the `main`
   block.

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

Common front‑matter keys used here:

| Key            | Purpose |
|----------------|---------|
| `title`        | `<title>` and OpenGraph/Twitter title |
| `Description`  | Meta description and social description |
| `images`       | Social share image (OpenGraph/Twitter) |
| `template`     | Layout to use (e.g. `single`) |
| `url`          | Custom permalink |
| `headerFixed`  | If true, renders a fixed (vs sticky) header |

## Styling

All styling is in **`assets/css/out.css`** — a **single, pre‑compiled
stylesheet** (~3,200 lines). Hugo minifies it at build time
(`resources.Minify`).

Key things to know:

- The file name `out.css` implies it was *generated* by an external pipeline
  (it carries the conventions of Michelin's internal design system — e.g.
  `feature-cards-slider-widget`, `apos-area`, Splide carousel classes). **The
  source for this pipeline is not part of this repository.**
- Practically, this means: **edit `out.css` directly.** There is no
  `npm run build:css` to regenerate it here. Treat it as a vendored asset and
  keep changes surgical.
- It ships **design tokens** as CSS custom properties on `:root`, e.g.
  spacing (`--spacing-xs` … `--spacing-xxl-16`), a grayscale ramp
  (`--gray-darken-*` / `--gray-lighten-*`), and semantic colors
  (`--primary-color`, `--accent-color`, `--link-color`, `--success-color`,
  `--error-color`). Prefer these tokens over hard‑coded values.
- Layout uses a Bootstrap‑like grid (`container`, `row`, `col-sm-4`,
  `col-lg-4`, …).

## JavaScript

`assets/js/script.js` is plain, dependency‑free JS handling two things:

1. **Back‑to‑top button** — shown after scrolling past one viewport height on
   long pages (`document.body.scrollHeight > 3000`).
2. **Mobile navigation** — the burger toggles `opened` / `no-scroll` classes;
   clicking a nav link or the close button collapses the menu.

The bundle is minified and fingerprinted by Hugo
(`resources.Minify | resources.Fingerprint`) for cache‑busting.

> A strict **Content‑Security‑Policy** is set in `baseof.html`
> (`script-src 'self'; object-src 'none'`). Any new JavaScript must be
> first‑party (served from this site). Inline scripts and third‑party CDNs are
> blocked by design.

## Images

All images live in `static/images/` and are referenced with absolute paths
(`/images/...`). Files under `static/` are copied verbatim — Hugo does **not**
process them.

**Optimization (recommended, not yet applied):** a few assets are heavy
(`couv.png` ~668 KB, `fond.png` ~320 KB, `oss-activities.png` ~272 KB,
`blog.png` ~140 KB). To shrink them you would typically:

1. Convert to **WebP/AVIF** (e.g. `cwebp -q 80 couv.png -o couv.webp`).
2. Update the references (`<img src>` and CSS `background-image: url(...)`).

A more idiomatic Hugo approach is to move images into `assets/` and use
[image processing](https://gohugo.io/content-management/image-processing/)
(`.Resize`, `.Fit`, WebP output) from templates. This is left as a future
improvement to avoid changing binary assets without a visual review.

## Deployment

Deployment is automated by **`.github/workflows/deploy.yml`**:

- **Trigger:** push to `main` (or manual `workflow_dispatch`).
- **Build:** checks out the repo, installs Hugo, runs `hugo --minify`.
- **Deploy:** uploads `public/` as a Pages artifact and publishes it to GitHub
  Pages.

The custom domain `opensource.michelin.io` is configured via the `CNAME` file.

> Pushing to a feature branch does **not** deploy. Open a pull request and
> merge to `main` to publish.

## Accessibility & SEO

- Decorative images use empty `alt=""`; meaningful images carry descriptive
  `alt` text.
- The contact email in the header is obfuscated with HTML entities to deter
  scrapers.
- `baseof.html` emits OpenGraph and Twitter card metadata, a meta description,
  keywords, `robots`, viewport, theme color, and a favicon.
- `enableRobotsTXT = true` in `hugo.toml` generates `robots.txt`.

## Maintenance & known caveats

These are intentional/known quirks — please read before "fixing" them:

- **Carousels are static.** The home page uses Splide‑style markup
  (`splide__*` classes) for the *Memberships* and *Projects* rows, but **no
  Splide JavaScript is loaded** (and the CSP would block a third‑party CDN
  anyway). The rows render as static grids. Crucially, the CSS sets
  `.splide { visibility: hidden; }`, so the **inline `style="...visibility:
  visible;"` on the wrapper is load‑bearing** — removing it would hide the
  cards. Do not strip these inline styles unless you also adjust the CSS.
- **`out.css` has no in‑repo source.** See [Styling](#styling) — edit it
  directly; there is no build step to regenerate it here.
- **Image weights.** See [Images](#images) — some PNGs are large; WebP/AVIF
  conversion is recommended but deliberately deferred (no image tooling in the
  default toolchain, and binary changes warrant a visual review).
- **`unsafe` Markdown is required.** Content embeds raw HTML; disabling
  `markup.goldmark.renderer.unsafe` would break the pages.

## Contributing

1. Create a feature branch from `main`.
2. Make your changes and verify locally with `hugo server`.
3. Open a pull request against `main`. Merging to `main` triggers the
   production deploy.

Please keep changes minimal and consistent with the existing markup and design
tokens.

## Legal

Content © Manufacture Française des Pneumatiques Michelin. See the
[legal notice](https://opensource.michelin.io/legal-notice) for full terms.
