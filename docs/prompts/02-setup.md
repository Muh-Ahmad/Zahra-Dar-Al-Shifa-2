# Session 2 — SETUP (theme foundation)

**Start:** after the PLAN pull request is merged into `staging`: new session · branch `staging` · environment `zds-shopify` · mode **Accept edits** → paste:
> Read docs/prompts/02-setup.md and follow it exactly. docs/plan.md is approved.

---

Goal: a working bilingual theme on the review theme, with the document shell, tokens, fonts, header, footer, sticky bar, language switch, WhatsApp/Call snippets, locales, settings, JSON-LD and a living style guide. The QA tooling must work end to end. The homepage sections come in the next session: here the homepage shows the header, an empty main area and the footer.

CLAUDE.md applies throughout. One logical change per commit. Stop at the gate.

## 1. Branch and starting theme
1. `git pull`, then `git switch -c claude/setup`.
2. Unpack the pinned Skeleton theme: `tar -xzf vendor/skeleton-theme-a7a655e.tgz -C /tmp`. Copy `assets/ blocks/ config/ layout/ locales/ snippets/ templates/` from `/tmp/skeleton-theme/` to the repo root. Copy its `AGENTS.md` to `docs/tech/skeleton-AGENTS.md` and its `LICENSE.md` to `docs/tech/skeleton-LICENSE.md`. Keep our `.theme-check.yml`, `.gitignore`, `.shopifyignore` and `README.md`.
3. `npm run check` must pass on the untouched copy. Commit: `chore(theme): add Skeleton theme a7a655e at the repo root`.

## 2. Clean-up and project dialect
1. Delete `blocks/hello-world.liquid`, `blocks/liquid-tips.liquid`, `assets/liquid-tips.js` and `assets/shoppy-x-ray.svg`. Reduce `templates/index.liquid` to one empty `container` for now.
2. Extend `blocks/container.liquid` per architecture.md §4, exception 1: optional `id`, `class` and `labelledby` parameters, documented as `@param` lines in its `{% doc %}` and output on the wrapper element as `id`, `class` and `aria-labelledby` (Theme Check warns about undocumented or unused parameters); alignment options `start`/`center`/`end` with default `start`.
3. `config/settings_schema.json`: set theme_info to theme name "ZDS" and author "Zahra Dar Al-Shifa"; remove Skeleton's font picker, colour and page-width settings (our tokens replace them); add a "ZDS flags" group with exactly the settings in architecture.md §5 and a "ZDS images" group with four optional `image_picker` settings (hero mobile, hero desktop Urdu, hero desktop English, portrait). Labels go in `locales/en.default.schema.json`.
4. `npm run check`, then commit.

## 3. Locales
1. `node scripts/build-locales.mjs` writes `locales/ur.json` and `locales/en.default.json`, replacing Skeleton's `en.default.json`. copy.yml already holds every key Skeleton's remaining templates use (404, blog, cart, customers, collections, gift_card, password, search). Keep `en.default.schema.json`.
2. `npm run check` (translation checks must pass) and `npm run qa:static`. Commit.

## 4. Tokens, CSS, fonts, icons
1. `assets/zds-tokens.css`: design-system.md §1 colours and roles, §2 font stacks, §3 spacing, radius and hairlines, §4 motion, exactly as written.
2. `assets/zds-critical.css` (above the fold only): reset (keep the useful parts of Skeleton's `critical.css`), base typography for English and Urdu (the §2 scale and every Urdu typesetting rule), container and grid, buttons, links, focus styles, header, hero shell, sticky bar, `.zds-ltr`, `.zds-visually-hidden`, `.js .zds-reveal`, reduced motion. Each inlined file < 15 KB, both together ≤ 12 KB.
3. `assets/zds-base.css`: everything below the fold (section header, notice, badge, cards, footer, style guide). Delete Skeleton's `critical.css` and `base.css` once nothing uses them.
4. Fonts (already installed as devDependencies): copy `node_modules/@fontsource-variable/noto-nastaliq-urdu/files/noto-nastaliq-urdu-arabic-wght-normal.woff2` → `assets/zds-nastaliq-var.woff2`, `@fontsource-variable/inter/files/inter-latin-wght-normal.woff2` → `assets/zds-inter-var.woff2`, `@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2` → `assets/zds-playfair-var.woff2`. `snippets/zds-fonts.liquid` declares the three `@font-face` rules (families "ZDS Nastaliq", "ZDS Sans", "ZDS Display"; weight ranges; `font-display: swap`; `unicode-range` copied from each package's `index.css`) and preloads exactly one file: Nastaliq on Urdu pages, Inter on English pages. Copy each package's licence to `docs/tech/fonts/`.
5. Icons as `assets/zds-icon-<name>.svg`, inlined by `snippets/zds-icon.liquid` with `inline_asset_content`: phone, map-pin, clock, chevron, arrow, copy, check, shield-lock, leaf, info from `lucide-static` (ISC licence); WhatsApp from `simple-icons` (CC0). `currentColor`, 24px grid; chevron and arrow get `zds-icon--dir`.
6. `src/assets/brand/logo-zds-cream-disc.png` is already a true transparent cut-out. If `logo-zds-gold-disc.png` exists without real transparency (no alpha channel, or a checkerboard painted in), fix it with `npm run logo:cutout -- <file> <same path>`. Then run `npm run images`. One commit per item.

## 5. Document shell, snippets, header and footer
1. `layout/theme.liquid` and `layout/password.liquid` per architecture.md §4: `lang`, `dir`, `data-zds-theme`, skip link to `#main`. `snippets/zds-head.liquid` renders Skeleton's `meta-tags` (viewport `width=device-width,initial-scale=1,viewport-fit=cover`; on the homepage the title and description come from `meta.home_title` / `meta.home_description`), `zds-fonts`, one `<style>` holding `{{ 'zds-tokens.css' | inline_asset_content }}` and `{{ 'zds-critical.css' | inline_asset_content }}`, non-blocking `zds-base.css`, `<script>document.documentElement.classList.add('js')</script>`, `zds-core.js` with `defer`, favicons when present, `zds-jsonld-clinic` on every page, and `noindex` on the style guide.
2. Snippets: `zds-bdi`; `zds-icon`; `zds-picture`; `zds-wa-link` (inputs: a `whatsapp.*` message key, optional specialty or product name, location, page code, label, class; builds `https://wa.me/<facts.whatsapp_number>?text=…` with `url_encode | replace: '+', '%20'`; outputs `data-zds-channel/location/page-code`, `data-zds-ref` holding the `whatsapp.ref` text, `target="_blank" rel="noopener"` and the visually hidden `a11y.opens_new`); `zds-call-link` (`tel:` + `facts.phone_e164`); `zds-lang-switch` (Shopify localization form; shows the other language in its own script with its `lang`); `zds-section-header`; `zds-notice`; `zds-sticky-bar`; `zds-jsonld-clinic` (seo.md: MedicalClinic, every pending property omitted, values through the `json` filter).
3. Blocks `zds-header` (blueprint §0) and `zds-footer` (blueprint §5) replace Skeleton's header and footer in the layout; delete `blocks/header.liquid` and `blocks/footer.liquid`. Logo: the cream-disc WebP when it exists, otherwise the brand name as text (never a drawn logo).
4. `assets/zds-core.js` (one deferred file, no dependencies): attribution capture and the ref-code builder that rewrites WhatsApp links (tracking.md §4–5), the `zds:contact_click` publisher (tracking.md §3), copy-address, reveal-on-scroll. The map facade comes in HOMEPAGE.
5. One commit per item.

## 6. Style guide
`templates/index.styleguide.liquid` + `blocks/zds-styleguide.liquid`, served at `/?view=styleguide`: colour swatches with their contrast ratios, English and Urdu type samples (from copy.yml) at every size, primary and secondary buttons at mobile and desktop sizes, links, section header, notice, badge, icons, language switch, WhatsApp and Call links, an LTR run inside Urdu (the phone through `zds-bdi`), and the pending-content placeholder (`show_dev_placeholders`). Only copy keys and facts keys, no typed text. Commit.

## 7. QA gate (use the `qa-gate` skill)
- Screenshots: `npm run qa:shots -- --pages "home-ur=/,home-en=/en,sg-ur=/?view=styleguide,sg-en=/en?view=styleguide"`.
- Lighthouse on `/` and `/en`: the baseline for an almost empty homepage (expect Performance ≥ 95).
- Report the sizes of fonts, inlined CSS, CSS and JS against architecture.md §8.
- Gate report in the CLAUDE.md format, with the mobile 390 and desktop 1440 screenshots in Urdu and English (first screen + full page) and the review artifact link. STOP and wait for "approved".

After approval, Ahmad merges `claude/setup` into `staging` and connects the Shopify GitHub integration to `staging` (cloud-setup.md §5).
