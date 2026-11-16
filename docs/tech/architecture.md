# Architecture

## 1. Decisions
| Area | Decision | Why |
|---|---|---|
| Platform | Shopify **Basic** plan (decision 2026-11-14), a paid store owned by the clinic's own Google account from day one. No Partner development store and no transfer step. The Starter plan is not enough (no full online-store theme). New Basic stores have no staff accounts (2026), so Ahmad works through the clinic login and later through collaborator access from his free Partner account. | Hosted checkout with COD, admin for products and orders, global CDN, and Shopify's Oct 2026 RTL support for Urdu in storefront, checkout and accounts. The clinic owns its store, domain and data. |
| Theme base | Shopify **Skeleton theme**, pinned at commit `a7a655e` (2026-10-01, "rc-v2.0.0", block-first composition), vendored as `vendor/skeleton-theme-a7a655e.tgz` (MIT licence), plus our own `zds-*` blocks. | Smallest possible CSS/JS (Lighthouse ≥ 90 is realistic) and Liquid-only templates, so all content lives in git with no theme-editor drift. Shopify wrote it to be edited by coding agents. Vendoring avoids network/proxy problems and keeps every session on the same version. |
| Theme dialect | Skeleton's block-first rules (`docs/tech/skeleton-AGENTS.md`, copied in SETUP): no `sections/`, no JSON templates, no `{% stylesheet %}`/`{% javascript %}`, blocks invoked only from `layout/` and `templates/`, `{% doc %}` + `{% schema %}` (no presets) in every block. Project exceptions in §4. | One clear dialect for every session. |
| Build | Buildless: plain modern CSS + one small vanilla JS file. Scripts only generate locales and images, and their outputs are committed. | Shopify's GitHub integration needs a ready-to-run theme at the repo root. |
| Languages | Urdu = default at `/`; English published at `/en`. | Audience reads Urdu first; Meta ads point to Urdu pages. |
| Theme copy | `locales/*.json` generated from `docs/content/copy.yml` + `docs/brand/facts.yml` by `scripts/build-locales.mjs`. | One git-controlled source for both languages. |
| Product content | Shopify admin (Urdu default) + English via **Translate & Adapt**. | Products are store data, not theme files. |
| Checkout | Shopify checkout; Cash on Delivery as a manual payment method. | Familiar and RTL-supported. One-page COD-form apps are a later A/B test (they add JS). |
| Ordering before compliance sign-off | WhatsApp ordering only (`enable_cart = false`). | DRAP status unconfirmed (compliance.md §5). |
| Launch order | **v0 first** (`docs/prompts/00-go-live.md`): one bilingual homepage with only confirmed facts, published as soon as Major Sahab approves the Urdu. Products, landing pages, tracking and policies follow in stages S4–S9. | The clinic needs a working link (Google Business Profile, ads, WhatsApp bio) now; nothing unconfirmed is ever shown. |
| Pixels | Official **Facebook & Instagram** app (Pixel + Conversions API) and **Google & YouTube** app (GA4), plus one custom pixel for contact clicks (`integrations/custom-pixel.js`). | No third-party scripts inside the theme. |

## 2. Repository layout
```
/  (repo root = Shopify theme root)
├── assets/ blocks/ config/ layout/ locales/ snippets/ templates/   ← theme (created in SETUP)
├── docs/            brand, content, design-system, tech, reference, prompts   ← never uploaded to Shopify
├── integrations/    custom-pixel.js (pasted into Shopify admin, not part of the theme)
├── scripts/         locales, QA, screenshots, Lighthouse, images, review-theme push, proof-read sheet, logo cut-out (Node ≥ 22.19)
├── src/assets/      images/ (original photos) · brand/ (logo masters)
├── vendor/          skeleton-theme-a7a655e.tgz (pinned starting theme)
├── qa/              screenshots/latest (JPG + manifest, committed) · lighthouse/latest (summary.md committed)
├── .claude/         settings.json, hooks/, agents/, skills/
└── CLAUDE.md  README.md  package.json  .gitignore  .shopifyignore  .theme-check.yml
```

## 3. Branches and themes
| Git branch | Shopify theme | Sync | Changed by |
|---|---|---|---|
| `claude/*` (one per stage) | `zds-review` (unpublished) | `npm run push:review` (CLI) | Claude Code |
| `staging` | `zds-staging` (unpublished) | Shopify GitHub integration (two-way) | merged, approved PRs |
| `main` | live theme (connected and published by Ahmad at go-live) | Shopify GitHub integration (two-way) | PR `staging → main` |

- Theme-editor changes on a GitHub-connected theme are **committed back** to its branch by Shopify, so always pull before starting work.
- Never use the admin **code** editor. Copy changes go into copy.yml, never into "Edit default theme content" or Translate & Adapt's theme-content screens (both create store-side overrides that beat the locale files).
- A store holds at most 20 themes, so reuse `zds-review` (`scripts/push-review.mjs` finds it by name and creates it only if it is missing).
- Protect `main` and `staging` on GitHub (pull request required). A protected branch can reject the commits Shopify makes when someone saves in the theme editor, so **nobody saves anything in the theme editor or code editor of a GitHub-connected theme**: every change goes through Claude → pull request. If Shopify ever reports a GitHub sync error, stop and tell Claude.
- Plan B at go-live, only if connecting `main` fails: Ahmad publishes the `zds-review` theme (it holds exactly the approved commit) and renames it `ZDS live`; `push-review.mjs` then refuses to touch it and creates a fresh `zds-review` next time. Connect `main` properly before the next stage.

## 4. Theme files (block-first)
- **layout/theme.liquid:** `<html lang="…" dir="…" data-zds-theme>` (the attribute lets QA scripts confirm the review theme is being served) → `{% render 'zds-head' %}` + `{{ content_for_header }}` → skip link → header block in a `container` (`tag: 'div'`) → `<main id="main">{{ content_for_layout }}</main>` → footer block in a `container` → `{% render 'zds-sticky-bar' %}`.
- **layout/password.liquid:** same head, no sticky bar.
- **templates/index.liquid:** four `container` blocks in the fixed order of homepage-blueprint.md, each wrapping one block: `zds-hero`, `zds-about`, `zds-medicines-treatments`, `zds-contact`.
- **templates/index.styleguide.liquid:** the living style guide at `/?view=styleguide` (noindex).
- Other Skeleton templates (product, collection, cart, page, 404, search, password, gift_card) stay working and are restyled in later stages.
- **blocks:** `container` (extended, see exceptions), `zds-header`, `zds-footer`, `zds-hero`, `zds-about`, `zds-medicines-treatments`, `zds-contact`, `zds-styleguide`. Skeleton's `hello-world`, `liquid-tips`, `header` and `footer` are deleted (replaced).
- **snippets:** `zds-head` (meta, fonts, inline CSS, preloads, JSON-LD), `zds-fonts`, `zds-preload-hero`, `zds-icon`, `zds-picture`, `zds-bdi`, `zds-wa-link`, `zds-call-link`, `zds-sticky-bar`, `zds-lang-switch`, `zds-section-header`, `zds-notice`, `zds-specialty-item`, `zds-product-card`, `zds-jsonld-clinic`, `zds-jsonld-person`; Skeleton's `meta-tags` (extended) and `image` stay; `css-variables` is replaced by `zds-head`.
- **assets:** `zds-tokens.css` + `zds-critical.css` (both inlined with `inline_asset_content`, which needs each file < 15 KB; together ≤ 12 KB), `zds-base.css` (loaded without blocking render), `zds-core.js` (deferred), fonts `zds-*.woff2`, icons `zds-icon-*.svg`, images `zds-<name>-<w>.webp`, `zds-map-facade.svg`. Skeleton's `base.css`, `critical.css`, `liquid-tips.js` and `shoppy-x-ray.svg` are removed once their useful rules live in ours.
- **config:** `settings_schema.json` (theme info + feature flags + optional image pickers), `settings_data.json`.
- **locales:** `ur.json`, `en.default.json` (generated) · `en.default.schema.json` (theme-editor labels, edited by hand).

**Project exceptions to Skeleton's dialect (the only ones):**
1. `blocks/container.liquid` gains optional `id`, `class` and `labelledby` parameters, and its alignment options become logical: `start` / `center` / `end` (default `start`), because `left`/`right` break RTL.
2. Dynamic translation keys are allowed only inside loops over `facts.specialties_public` / `facts.specialties_private` (the order lives in facts.yml). build-locales guarantees every generated key exists.
3. The sticky bar is a snippet rendered by the layout (it has no settings).

## 5. Theme settings: feature flags (and optional images) only
Facts live in locale keys `facts.*` (generated). Settings hold only switches:
| Setting | Default | Meaning |
|---|---|---|
| `enable_cart` | false | Add to cart + cart page; flip only after compliance §5 sign-off |
| `show_prices` | true | show the price when > 0 |
| `show_registration` | true | NCT registration row in About + footer line (QH-45342-A is confirmed, 2026-11-14) |
| `show_testimonials` | false | testimonials block (real and consented only) |
| `hero_variant` | `a` | headline A/B (`hero.headline_a` / `hero.headline_b`) |
| `show_desktop_whatsapp_fab` | true | floating WhatsApp button ≥ 990px |
| `show_dev_placeholders` | false | dashed boxes for pending content (review theme only) |
Optional `image_picker` settings (group "ZDS images": hero mobile, hero desktop Urdu, hero desktop English, portrait) override the bundled images when set (§9).

## 6. i18n pipeline
`copy.yml` + `facts.yml` → `node scripts/build-locales.mjs` → `locales/ur.json` + `locales/en.default.json` with identical key trees.
- Facts become `facts.*` keys (`facts.doctor`, `facts.phone`, `facts.hours`, …). Values marked `[PENDING]`/`[CONFIRM]` become `""`, so `{% if %}` checks hide them.
- Specialties become `facts.specialties.<key>.name` / `.code` / `.group`, plus ordered lists `facts.specialties_public` and `facts.specialties_private` (comma-separated keys). Every specialty also gets `treatments.notices.<key>` (empty when it has no notice).
- Placeholders such as `{{ doctor }}` are filled in Liquid: `{{ 'hero.sub' | t: doctor: doctor_name }}`, where `doctor_name` is `'facts.doctor' | t`.
- Shopify admin: Urdu is the default language, English is published, and no automatic language or country redirection is switched on (ad visitors must land on Urdu `/`). Translate product titles and descriptions with Translate & Adapt. **Set product handles manually in English/Roman Urdu**, because Urdu titles generate unreadable handles.

## 7. RTL implementation
- `<html lang="{{ request.locale.iso_code }}" dir="{% if request.locale.iso_code == 'ur' %}rtl{% else %}ltr{% endif %}">`.
- CSS: logical properties only (`margin-inline-*`, `padding-inline-*`, `inset-inline-*`, `border-inline-*`, `border-start-start-radius`, `text-align:start|end`); layout via flex/grid with `gap`, which mirrors automatically. `npm run qa:static` fails on physical left/right properties unless the line ends with `/* rtl-ok */`.
- **Bidi isolation:** `snippets/zds-bdi.liquid` wraps every LTR run (`<bdi dir="ltr" class="zds-ltr">…</bdi>`): phone numbers, prices (`| money`), times, dates, "3/1 B-Commercial", English names, ref codes, "100%". Without it, a phone number with a space such as "0321 6393999" can display as "6393999 0321" in RTL text.
- Icons: only `.zds-icon--dir` flips. Inputs for phone and email: `dir="ltr"` + `inputmode`.
- Never mirror a photo to suit RTL (it reverses signboards and certificates). Use the per-language crops in assets-checklist.md instead.
- Urdu punctuation ۔ ، ؟ inside Urdu sentences.

## 8. Performance budgets (mobile Lighthouse, simulated slow 4G): acceptance criteria
| Metric | Budget |
|---|---|
| LCP | ≤ 2.5 s (target 2.0 s) |
| CLS | ≤ 0.05 |
| TBT | ≤ 200 ms |
| Lighthouse Performance, homepage `/` and `/en` | ≥ 90 |
| Accessibility · Best Practices · SEO | ≥ 95 |
| Hero image served on mobile | ≤ 120 KB (WebP, 768w max) |
| Images above the fold, total | ≤ 200 KB |
| Theme JS (all `zds-*.js`, gzip) | ≤ 20 KB, `defer`, no framework |
| Theme CSS (gzip) | ≤ 25 KB; inlined CSS ≤ 12 KB |
| Fonts, Urdu pages | ≤ 300 KB: Noto Nastaliq Urdu variable, Arabic subset (~233 KB, preloaded) + Inter variable, Latin subset (~47 KB) |
| Fonts, English pages | ≤ 90 KB: Playfair Display variable (~38 KB) + Inter variable (~47 KB, preloaded) |
| Third-party scripts | none in theme; every app needs approval + a before/after Lighthouse run |

Font sizes were measured from the @fontsource-variable packages (v5.3.0) on 2026-11-05.

Techniques: preload the LCP image (matching breakpoint and language only) with `fetchpriority="high"`; explicit `width`/`height` on every image; `loading="lazy"` below the fold; `content-visibility:auto` on below-fold sections; `font-display:swap` with metric-matched fallbacks (switch to `optional` if font swap pushes CLS > 0.05); map facade; no render-blocking scripts; non-blocking `zds-base.css` (`media="print" onload="this.media='all'"` + `<noscript>`).

## 9. Images
`src/assets/images/*.jpg` (≥ 2400px) and `src/assets/brand/*` → `npm run images` → `assets/zds-<name>-<w>.webp` (a `zds` word in the source name is dropped: `logo-zds-cream-disc.png` → `zds-logo-cream-disc-160.webp`).
- Widths 480, 768, 1080, 1440, 1920 (never upscaled), WebP quality 72; `hero-*-4x5` only 480 and 768 (so phones never download more than the 120 KB budget); logos 160/320/640; favicons PNG 32/180/512.
- EXIF (including GPS location) is stripped.
- `snippets/zds-picture.liquid` builds `srcset`/`sizes`.
- When an optional image setting (§5) is filled with a Shopify Files image, use `image_url` + `image_tag` with the same widths instead (Shopify's CDN then also serves AVIF where supported). Alt text always comes from copy.yml.

## 10. JavaScript (`assets/zds-core.js`, one deferred file)
Modules: UTM and attribution capture · WhatsApp link builder (adds ref code) · `zds:contact_click` publisher · map facade · copy-address · reveal-on-scroll · nothing else.
Progressive enhancement: every link works without JS (server-rendered `wa.me` and `tel:` URLs); JS only adds the ref code and tracking. Wrap `localStorage` in try/catch.

## 11. Accessibility baseline (WCAG 2.2 AA)
Skip link; landmarks (`header`, `nav`, `main`, `footer`); one H1; logical headings; focus-visible on everything; targets ≥ 48px; contrast per design-system; `lang` on mixed-language snippets; descriptive link text (no "click here"); `aria-live` for copy confirmation; no information by colour alone; respects reduced motion; zoom to 200% without loss.

## 12. Apps policy
Allowed: Facebook & Instagram (Meta), Google & YouTube, Translate & Adapt, Theme Access, a courier app [CONFIRM]. Anything else needs Ahmad's OK, a Lighthouse run before and after, and removal if it costs more than 3 Performance points without clear revenue.

## 13. Security
Theme Access password and storefront password live only in the cloud environment's variables. Never commit `.env`, tokens or customer data. If the Theme Access password ever appears in a log, chat or commit, revoke it in the Theme Access app and create a new one.
