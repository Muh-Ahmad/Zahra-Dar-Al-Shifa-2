# Design system — Zahra Dar Al-Shifa

> **Review pending (2026-11-14):** Ahmad is choosing a new reference website. When he sends it, this file and `homepage-blueprint.md` are updated first; the clinic's own identity (logo, colours from the logo and packaging, voice, facts, compliance) does not change. Until then, the tokens below stand.

**Direction: herbal luxury, editorial calm.** Deep green-black and ivory surfaces, antique gold reserved for action.
Inspired by luxury editorial sites (large imagery, whitespace, hairlines, quiet typography), never copied from them.
Implement tokens **exactly** as below in `assets/zds-tokens.css` (inlined in `<head>`; see architecture.md §4). Any new token must be added here first.

## 1. Colour tokens
```css
:root{
  /* green-black: dark surfaces */
  --zds-ink-950:#0A120E; --zds-ink-900:#0F1A14; --zds-ink-800:#16241C; --zds-ink-700:#24362B;
  /* brand greens */
  --zds-forest-700:#0F3D20; --zds-forest-600:#1B5E32;
  /* ivory: light reading surfaces */
  --zds-ivory-50:#FBF9F2; --zds-ivory-100:#F5F1E4; --zds-cream-200:#EDE6D1;
  /* stone greys */
  --zds-stone-300:#C9C3B4; --zds-stone-500:#8A8578; --zds-stone-700:#5B574D;
  /* antique gold */
  --zds-gold-400:#E2C27A; --zds-gold-500:#D4A843; --zds-gold-700:#7A5B17;
  /* functional */
  --zds-danger-600:#B42318;

  /* roles: use these in components, not raw colours */
  --zds-bg:var(--zds-ivory-50);        --zds-fg:var(--zds-ink-950);        --zds-fg-muted:var(--zds-stone-700);
  --zds-bg-alt:var(--zds-ivory-100);
  --zds-bg-dark:var(--zds-ink-950);    --zds-fg-on-dark:var(--zds-ivory-50); --zds-fg-muted-on-dark:var(--zds-stone-300);
  --zds-cta-bg:var(--zds-gold-500);    --zds-cta-bg-hover:var(--zds-gold-400); --zds-cta-fg:var(--zds-ink-950);
  --zds-accent-on-light:var(--zds-gold-700); --zds-accent-on-dark:var(--zds-gold-500);
  --zds-link-on-light:var(--zds-forest-600);
  --zds-hairline-light:var(--zds-cream-200); --zds-hairline-dark:rgba(212,168,67,.35);
  --zds-focus-light:var(--zds-forest-600);   --zds-focus-dark:var(--zds-gold-400);
}
```

### Verified contrast (WCAG 2.x, computed)
| Text on background | Ratio | Allowed use |
|---|---|---|
| ivory-50 on ink-950 | 18.03 | all text on dark |
| stone-300 on ink-950 | 10.81 | muted text on dark |
| gold-500 on ink-950 | 8.57 | eyebrows, headings, links on dark |
| gold-400 on ink-950 | 11.06 | hover/focus on dark |
| ink-950 on gold-500 | 8.57 | **CTA button text** |
| ink-950 on ivory-50 | 18.03 | body text |
| ink-950 on ivory-100 | 16.81 | body text on alt sections |
| forest-600 on ivory-50 | 7.40 | links, icons, headings on light |
| stone-700 on ivory-50 | 6.84 | muted text on light |
| gold-700 on ivory-50 | 5.97 | gold-tinted text on light (eyebrows, numbers) |
| gold-700 on ivory-100 | 5.57 | same, on alt sections |
| danger-600 on ivory-50 | 6.24 | errors |
| ivory-50 on forest-700 | 11.67 | text on green bands |
| gold-500 on forest-700 | 5.55 | gold text on green bands |
| ⛔ gold-500 on ivory-50 | 2.10 | decorative lines only, never text |
| ⛔ stone-500 on ivory-50 | 3.49 | text ≥ 24px only, or decorative |
| ⛔ forest-600 on ink-950 | 2.44 | never green text on dark |
| ⛔ gold-500 on forest-600 | 3.52 | large text (≥ 24px) only |

## 2. Typography
| Role | Family | Weights | Source (self-hosted in `assets/`) | File (measured) | Loaded on |
|---|---|---|---|---|---|
| All Urdu text | Noto Nastaliq Urdu | variable 400–700 | `@fontsource-variable/noto-nastaliq-urdu` (OFL), Arabic subset | ~233 KB, preloaded | Urdu pages |
| English display | Playfair Display | variable (use 500, 600) | `@fontsource-variable/playfair-display` (OFL), Latin subset | ~38 KB | English pages |
| English body + all digits and Latin runs | Inter | variable (use 400, 600) | `@fontsource-variable/inter` (OFL), Latin subset | ~47 KB | all pages |

Copy each file's `unicode-range` from the package's `index.css` into our `@font-face` rules (`snippets/zds-fonts.liquid`) and rename the families to "ZDS Nastaliq", "ZDS Display" and "ZDS Sans". Digits inside Urdu text render in Inter (second in the Urdu stack), so no extra Latin Nastaliq file is needed.

**Why Noto Nastaliq Urdu:** it is true Nastaliq (the script Urdu readers trust), open-licensed for the web, shapes correctly in Chrome and Safari, and ships as a system font on iPhones and Macs, so the fallback looks almost identical while the web font loads. Jameel Noori Nastaleeq stays in print and ads; its web licence is unclear and its files are heavy. **Gulzar** (OFL, ~204 KB, one weight) is the tested alternative if Nastaliq rendering or budget fails visual QA.

```css
:root{
  --zds-font-ur:"ZDS Nastaliq","ZDS Sans","Noto Nastaliq Urdu","Urdu Typesetting","Jameel Noori Nastaleeq",serif;
  --zds-font-display:"ZDS Display","Playfair Display",Georgia,"Times New Roman",serif;
  --zds-font-sans:"ZDS Sans","Inter",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
}
html[lang="ur"] body{font-family:var(--zds-font-ur)}
html[lang="en"] body{font-family:var(--zds-font-sans)}
.zds-ltr{font-family:var(--zds-font-sans);direction:ltr;unicode-bidi:isolate} /* phone, price, codes inside Urdu */
```

### Type scale (rem, base 16px). Urdu runs about 1.15× larger because Nastaliq reads smaller.
| Token | English | Urdu |
|---|---|---|
| display (H1) | `clamp(2.25rem,1.6rem + 3.2vw,4.25rem)` · line-height 1.08 · Playfair 500 | `clamp(2rem,1.5rem + 3vw,3.75rem)` · 1.75 · 700 |
| h2 | `clamp(1.75rem,1.4rem + 1.8vw,2.75rem)` · 1.15 · Playfair 500 | `clamp(1.65rem,1.35rem + 1.6vw,2.5rem)` · 1.8 · 700 |
| h3 | 1.375rem · 1.3 · Playfair 600 | 1.35rem · 1.9 · 700 |
| body | 1.0625rem (17px) · 1.65 · Inter 400 | 1.1875rem (19px) · 2.0 · 400 |
| small | 0.9375rem · 1.55 | 1.0625rem · 1.95 |
| eyebrow | 0.75rem · Inter 600 · uppercase · letter-spacing .18em | 1rem · 500 · **no** uppercase, **no** tracking |
| button | 1rem · Inter 600 · letter-spacing .02em | 1.125rem · 700 |

### Urdu typesetting rules (non-negotiable)
- `letter-spacing:0` always; no `text-transform`, no italic, no `text-align:justify`; `font-synthesis:none`.
- Line-height never below 1.6, even in buttons and pills (use `padding-block` and `min-height` instead).
- Nastaliq has tall ascenders and deep descenders: any container with `overflow:hidden` needs at least `0.25em` of extra block padding. Do not use `-webkit-line-clamp` on Urdu.
- Headings: `text-wrap:balance`, at most 3 lines on mobile, no single-word last line.
- Mixed text: wrap Latin and digit runs with `zds-bdi` (`<bdi dir="ltr" class="zds-ltr">`).

## 3. Space, grid, shape
- Spacing scale: `--zds-space-1:4px; -2:8px; -3:12px; -4:16px; -5:24px; -6:32px; -7:48px; -8:64px; -9:96px; -10:128px`.
- Section padding (block): `clamp(64px,8vw,144px)`.
- Grid: mobile 4 columns, gutter 16px, side margin 20px · tablet (≥ 768) 8 columns, gutter 24px, margin 32px · desktop (≥ 1024) 12 columns, gutter 24px, max container 1320px.
- Radius: buttons and pills `999px`; cards and notices `2px`; full-bleed images `0`.
- Hairlines: 1px. Section-header rule: 48px × 1px gold (`--zds-gold-500` on dark, `--zds-gold-700` on light).
- Shadows: none, except the sticky bar `0 -8px 24px rgba(10,18,14,.18)`.

## 4. Motion
- Tokens: `--zds-ease:cubic-bezier(.2,.7,.2,1)`, `--zds-dur:400ms`.
- Allowed: below-the-fold reveal (opacity 0→1, translateY 12px→0, once), button hover and press (`scale(.98)`), map facade fade.
- Nothing animates above the fold. Everything is off under `prefers-reduced-motion: reduce`. Content is visible without JavaScript.

## 5. Icons
- 24px grid, 1.5px stroke, `currentColor`, inline SVG through `snippets/zds-icon.liquid`.
- Set: whatsapp (official glyph, drawn only in black, white or ink-950, never recoloured gold), phone, map-pin, clock, chevron, arrow, copy, check, shield-lock (privacy), leaf, knee, walking-person.
- Directional icons (chevron, arrow) get `.zds-icon--dir` and flip in RTL: `[dir=rtl] .zds-icon--dir{transform:scaleX(-1)}`. Never flip the logo, WhatsApp, phone, play or numbers.

## 6. Components
Every interactive element: touch target ≥ 48×48px; visible `:focus-visible` outline 2px, offset 3px (`--zds-focus-dark` on dark sections, `--zds-focus-light` on light).

| Component | Anatomy & rules |
|---|---|
| **Button: primary** | Gold fill, ink text, pill, height 56px (mobile, full width) / 48px (desktop), optional leading icon. Hover: gold-400. Press: scale .98. Used for WhatsApp only, so there is one primary action per view. |
| **Button: secondary** | Transparent, 1px ivory border on dark (forest-600 on light), same sizes. Used for Call and Directions. Shows the phone number in `zds-ltr`. |
| **Link** | forest-600 on light, gold-500 on dark, underline offset 3px; directional arrow flips in RTL. |
| **Language switch** | Pill, min height 44px, shows the *other* language in its own script ("English" on Urdu pages, "اردو" on English pages) with the matching `lang` attribute. Built with Shopify's localization form so it works without JS. |
| **Section header** | Eyebrow (gold) → H2 → 48px gold hairline. Aligned to inline-start. |
| **Hero** | Full-bleed photo + scrim; content block at inline-start bottom; see homepage-blueprint.md. |
| **Credential list** | Definition list; each row: label (muted) + value; hairline between rows; pending rows are not rendered. |
| **Pillar** | Small gold icon, h3, one sentence; on desktop three in a row with a gold top hairline. |
| **Notice** | ivory-100 background, 3px forest-600 border on `border-inline-start`, info icon, small text. Safety notices only. |
| **Specialty row (mobile)** | Min height 64px: Latin number (gold-700, Inter) · name (h3) · one-liner (small) · chevron (flips). The whole row is one WhatsApp link. |
| **Specialty tile (desktop)** | Editorial card: number, name, one-liner, "Consult →" link; cream-200 hairline border; hover lifts the border to gold-700. |
| **Private card** | ink-950 background, ivory text, gold hairline, shield-lock icon, neutral CTA (code PRV). |
| **Product card** | Image 4:5 on a cream-200 plinth; name; size; one-line use; price (`zds-ltr`) or "WhatsApp us for the price"; badges (external use); "Order on WhatsApp" (primary) + "Add to cart" (secondary, only when the cart is enabled). Mobile: horizontal card (image 40% at inline-start). Desktop: vertical card. |
| **Badge** | Small pill, cream-200 background, ink text, 0.875rem. |
| **Medallion icon** | From the knee-oil artwork (`docs/reference/ref-ad-template-knee-oil.png`): a 56px circle (72px on desktop), soft forest-tinted fill (`color-mix(in oklab, var(--zds-forest-600) 12%, var(--zds-ivory-50))`), 1.5px gold-500 ring, icon 28px in forest-700. Used in a row of three (e.g. knee · leaf · walking-person) on the joint-oil product page and its landing page, each with a real text label underneath. Decorative: `aria-hidden="true"` on the SVG; the label carries the meaning. |
| **Address block** | Urdu address + landmark; English address line underneath in Inter (LTR); "Copy address" button with a "copied" confirmation (`aria-live="polite"`). |
| **Map facade** | 16:10 branded SVG (abstract streets + gold pin), "Show map" button; on tap, inject the Google Maps iframe (`title`, `loading="lazy"`). The iframe is never loaded before the tap. |
| **Sticky bar** | Mobile only (< 990px): 64px + `env(safe-area-inset-bottom)`; WhatsApp (gold) and Call (ink-900, ivory text) at 50/50; `<nav aria-label>`. The body gets matching `padding-bottom`. |
| **Footer** | ink-950, gold hairline top, cream-disc logo 96px, tagline, anchors, policy links, disclaimer (current language), emergency line, registration (when confirmed), © year. |

## 7. Imagery & art direction
- Ratios: hero mobile 4:5, hero desktop 3:2, portrait 4:5, product 4:5, map 16:10.
- Hero subject in the top third (mobile) or at inline-end (desktop), so text never covers a face.
- Scrim instead of darkening the whole photo: `linear-gradient(to bottom, transparent 30%, rgba(10,18,14,.88) 62%, #0A120E 100%)` on mobile; from inline-start on desktop.
- Placeholder (no real photo yet): neutral apothecary still life, same crops, never a person.
- **Brand artwork vs the website:** ad and print artwork (pamphlets, the knee-oil template with satin ribbons) is never placed on the site as a picture with words inside it. Words in an image cannot be read by Google or screen readers, cannot switch language, and the file is heavy. The site rebuilds its motifs in code instead: gold hairline rules (section header), medallion icons (§6), the cream-disc logo. The large satin ribbon swooshes are not used (heavy images; they compete with Nastaliq).
