# Design System

A small, pragmatic design system for the Michelin Open Source site. The goal is
**coherent rules** (one source of truth for colour, type, spacing and motion)
and a **fluid responsive** layout that scales smoothly instead of jumping at
breakpoints — while preserving Michelin's visual identity.

## Principles

1. **Tokens first.** Components consume CSS custom properties, never magic
   numbers.
2. **Fluid over breakpoints.** Typography and spacing use `clamp()`; each clamp's
   maximum equals the previous fixed desktop value, so desktop is unchanged and
   only smaller screens scale down.
3. **Layered & non‑destructive.** A new tokens/system layer sits on top of the
   legacy compiled CSS; the vendor file is not rewritten.
4. **CSP‑safe.** No third‑party CSS/JS. Interactivity is first‑party and
   dependency‑free.

## Architecture

The design system is written in **SCSS** (`assets/scss/`) and compiled by Hugo
extended (`css.Sass`, libsass). `layouts/_default/baseof.html` concatenates the
legacy CSS with the compiled output, in this order:

```
vendor.css  +  scss/main.scss → CSS
(legacy)        (design system — loaded last, so it wins)
```

Because custom properties resolve at use‑time and the compiled `:root` lands
**after** `vendor.css`, redefining a token (e.g. `--spacing-ml`) instantly makes
every existing rule that uses `var(--spacing-ml)` fluid — without editing the
vendor rules.

`main.scss` imports the partials in order:

| Partial | Responsibility |
|---------|----------------|
| `_functions.scss` | `fluid($min, $max, $wmin, $wmax)` → a `clamp()` interpolating between two viewport widths (max = former desktop value). |
| `_mixins.scss`    | `visually-hidden`, `focus-ring`, `surface-card`. |
| `_tokens.scss`    | Sass maps for the type/spacing scales, emitted as `:root` custom properties (colours, fonts, fluid type, fluid spacing, radii, shadows, motion, layout, z‑index). |
| `_typography.scss`| Fluid type applied to the existing heading utilities + the hero. |
| `_carousel.scss`  | The swipeable `.ds-carousel` component. |
| `_utilities.scss` | Accessibility helpers. |

`assets/css/vendor.css` is the legacy compiled Michelin design system (vendored;
edit directly and sparingly). It is intentionally kept out of the SCSS pipeline.

> **Requires Hugo *extended*** — libsass is built into the extended edition. The
> CI sets `extended: true`; locally, `hugo version` must report `+extended`.

### Generating fluid values

```scss
// _functions.scss turns a min/max (rem) into a clamp() between two viewports:
--fs-h2: #{fluid(1.375, 1.75)};   // → clamp(1.375rem, 1.077rem + 1.3vw, 1.75rem)
```

The `$type-scale` and `$space-scale` maps in `_tokens.scss` are looped with
`@each` to emit every `--fs-*` / `--spacing-*` token, so the scales stay DRY.

## Tokens

### Colours

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0e1532` | Page background (dark blue) |
| `--color-text` | `#ffffff` | Default text |
| `--color-text-muted` | `rgba(255,255,255,.72)` | Secondary text (card descriptions) |
| `--color-primary` | `#27509b` | Michelin blue |
| `--color-accent` | `#fce500` | Bold yellow (CTAs, carousel arrows) |
| `--color-on-accent` | `#0e1532` | Foreground on accent surfaces |
| `--color-purple` | `#5b6ee6` | Brand purple |
| `--color-create` / `--color-consume` / `--color-contribute` | green / yellow / cyan | Activity accents on the home page |
| `--color-card-border` / `…-hover` / `--color-card-bg-hover` | translucent white | Card surfaces over the dark bg |

### Typography

Families: `--font-display` (MichelinUnitTitling‑Bold), `--font-display-light`,
`--font-body` (Noto Sans). Line‑heights: `--line-tight` 1.2, `--line-snug` 1.35,
`--line-base` 1.5.

Fluid type scale (`clamp(min, preferred, max)` — max = current desktop size):

| Token | Range (≈) | Used for |
|-------|-----------|----------|
| `--fs-display` | 28 → 72px | Hero title |
| `--fs-display-2` | 20 → 52px | Hero subtitle |
| `--fs-h2` | 22 → 28px | Section titles |
| `--fs-h3` | 20 → 24px | Sub‑headings / card titles |
| `--fs-h4` | 18 → 22px | Activity headings |
| `--fs-h5` / `--fs-h6` | 17→20 / 16→18px | Minor headings |
| `--fs-lead` | 15 → 22px | Hero tagline |
| `--fs-body` | 16px | Body copy |
| `--fs-small` | 14px | Card descriptions |

### Spacing

A fluid scale (small steps stay fixed; `sm`+ use `clamp()` with max = legacy px):

```
--spacing-xs 2 · --spacing-s 4 · --spacing 8        (fixed)
--spacing-sm     12 → 16      --spacing-l       24 → 40
--spacing-m      16 → 24      --spacing-xl      28 → 48
--spacing-ml     20 → 32      --spacing-xxl     32 → 64
--spacing-xxl-9..16          36 → 72 … 56 → 128
```

Semantic aliases: `--space-section` (= `--spacing-xxl`), `--space-gap`
(= `--spacing-m`).

### Radii, elevation, motion, layout

| Group | Tokens |
|-------|--------|
| Radii | `--radius-sm` 5 · `--radius-md` 8 · `--radius-lg` 11 · `--radius-pill` 999 |
| Elevation | `--shadow-card` |
| Motion | `--ease` (standard), `--dur-fast` 150ms · `--dur` 300ms · `--dur-slow` 500ms |
| Layout | `--container-max` 1100px · `--carousel-logos-max` 800px |
| Z‑index | `--z-base` · `--z-carousel-nav` · `--z-header` |

Breakpoints (reference only — prefer fluid values): sm 600 · md 960 · lg 1280.

## Components

### Carousel (`.ds-carousel`)

A swipeable, CSP‑safe slider. Touch swiping is native via CSS scroll‑snap;
`assets/js/carousel.js` adds prev/next buttons and click‑and‑drag on desktop,
and hides/disables the arrows based on scroll position.

**Markup contract**

```html
<section class="ds-carousel" data-carousel aria-label="…">
  <button class="ds-carousel__nav ds-carousel__nav--prev" data-carousel-prev aria-label="Previous" hidden></button>
  <ul class="ds-carousel__track" data-carousel-track>
    <li class="ds-carousel__item">
      <a class="ds-carousel__card" href="…">
        <span class="ds-carousel__media" style="background-image:url(…)"></span>
        <h3 class="ds-carousel__title">…</h3>
        <p class="ds-carousel__text">…</p>
      </a>
    </li>
    …
  </ul>
  <button class="ds-carousel__nav ds-carousel__nav--next" data-carousel-next aria-label="Next" hidden></button>
</section>
```

**Variants & notes**

- `.ds-carousel--logos` — square media, narrower track; for logo‑only cards
  (the media carries `role="img"` + `aria-label` for its accessible name).
- The track uses `justify-content: safe center` so cards centre when they fit
  and scroll when they don't (the `safe` keyword avoids the
  centred‑overflow‑unreachable bug).
- Decorative project media use `aria-hidden="true"` (the `<h3>` names the card).

### Typography utilities

The legacy `.h2-mobile-white-bold`, `.h3-white-bold`, `.h4/5/6-*`,
`.p-white-*` classes keep their families/colours/weights from `vendor.css`;
`_typography.scss` only swaps their `font-size` to the fluid scale.

### Accessibility helpers

`.visually-hidden` (screen‑reader‑only text), a global `:focus-visible` ring in
the accent colour, and a `prefers-reduced-motion` block that neutralises
animations and smooth scrolling.

## Extending the system

- **New colour / size?** Add it to the relevant map/variable in `_tokens.scss`
  (the `@each` loops emit the custom properties), then reference `var(--…)`.
- **New component?** Add a partial (or a rule in an existing one), import it from
  `main.scss`, prefix classes with `ds-`, and use tokens; avoid new hard‑coded
  breakpoints — reach for `fluid()` / `clamp()` first.
- **Touching the vendor file?** Prefer overriding in an SCSS partial (compiled
  output loads last) rather than editing `vendor.css`.
- Verify locally with `hugo server` (Hugo **extended**) before opening a PR.
