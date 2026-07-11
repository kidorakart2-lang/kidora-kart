# Plan — Dynamic Font Weights per Theme

## Goal
Make heading/body/CTA font weights switch automatically with the active theme, so each theme has its own typographic personality.

## Theme Font Weight Profiles

| Theme | Heading | Body | CTA/Button | Style |
|---|---|---|---|---|
| **minimal** | 300 (light) | 300 (light) | 400 (normal) | Airy, elegant, spacious |
| **brown** | 400 (normal) | 400 (normal) | 500 (medium) | Warm, readable, inviting |
| **monochrome** | 600 (semibold) | 400 (normal) | 600 (semibold) | Bold, editorial, high-contrast |

## Tasks

### 1. Theme CSS Variables
- `themes/minimal.css` — add `--font-heading`, `--font-body`, `--font-cta`
- `themes/brown.css` — add same vars
- `themes/monochrome.css` — add same vars

### 2. Utility Classes (index.css)
- `.fw-heading` → `font-weight: var(--font-heading)`
- `.fw-body` → `font-weight: var(--font-body)`
- `.fw-cta` → `font-weight: var(--font-cta)`

### 3. Component Updates
Replace hardcoded font weights in sections:
- Section headings: `font-light` / `font-semibold` → `.fw-heading`
- Body text: stays as-is or → `.fw-body`
- Buttons/CTAs: → `.fw-cta`

### 4. Documentation
- `design.md` — add Font Weight Tokens table
- `guideline.md` — add rule: use `.fw-heading` / `.fw-cta` not hardcoded weights

## Files Modified
- `web/src/app/themes/minimal.css`
- `web/src/app/themes/brown.css`
- `web/src/app/themes/monochrome.css`
- `web/src/app/globals.css` (utility classes)
- Section components with hardcoded font weights
- `web/src/docs/design.md`
- `web/src/docs/guideline.md`

## Verification
- `pnpm tsc --noEmit` — typecheck clean
- Toggle `body.minimal` / `body.brown` / `body.monochrome` — font weights change visually
