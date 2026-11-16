# QA gate

Run before every approval gate (or call the skill `qa-gate`). Thresholds live in `architecture.md` §8 and `CLAUDE.md` → Definition of done.

## 1. Steps
1. `node scripts/build-locales.mjs` (if copy.yml or facts.yml changed).
2. `npm run check`: Shopify Theme Check, 0 errors.
3. `npm run qa:static`: physical left/right CSS, banned words (compliance.md §2), ur/en locale key parity, pending-marker report.
4. `npm run push:review`: finds the theme named `$REVIEW_THEME` (creates it unpublished the first time), refuses if it is the live theme, pushes with `--strict`, and saves `{id, previewUrl, editorUrl}` to `qa/.review-theme.json`.
5. `npm run qa:shots`: reads the theme id from `qa/.review-theme.json` (or `--theme <id>`), unlocks the storefront password, hides the preview bar (`pb=0`), checks the page really is our theme (`data-zds-theme`), saves JPGs, `manifest.json` and `console.txt` to `qa/screenshots/latest/`.
6. `npm run qa:lh`: Lighthouse mobile, median of 3 runs, for `/` and `/en` → `qa/lighthouse/latest/summary.md`. Before launch the `is-crawlable` audit is skipped, because password-protected preview pages are deliberately not indexable.
7. Subagents: `compliance-reviewer` → `urdu-rtl-reviewer` → `qa-auditor`. Fix every BLOCKER and MAJOR.
8. Optional: `npm run qa:review` → `qa/review.html`; publish it as an artifact so Ahmad can review on his phone (private link; he may share a public link with Major Sahab).
9. Commit (`chore(qa): screenshots + lighthouse <stage>`), push, post the gate report (CLAUDE.md format) and stop.

**Before any launch:** `npm run qa:proofread` builds `qa/proofread.html` (publish it as an artifact) so Major Sahab can approve every Urdu text, fact and yes/no question by number. Then the launch check must PASS: `npm run qa:launch:v0` for the one-page v0 (only what v0 shows, `docs/tech/v0-scope.yml`), `npm run qa:launch` for the full launch in S8.

## 2. Screenshot set
File name: `{page}-{lang}-{device}-{fold|full}.jpg`
| Device | Viewport | Scale |
|---|---|---|
| `mobile` | 390×844 | 2× |
| `android` | 360×800 | 2× (fold only) |
| `desktop` | 1440×900 | 1× |
Pages: always `home-ur` (`/`) and `home-en` (`/en`), plus whatever the stage adds (`--pages "name=/path,…"`).

## 3. Checklists
**RTL & Urdu**
- [ ] `dir="rtl"` on Urdu pages; text and layout start on the right.
- [ ] Phone numbers, prices, times and codes read correctly (not reversed) inside Urdu text.
- [ ] Chevrons and arrows point the reading direction; the logo, WhatsApp and phone icons are not flipped.
- [ ] No clipped Nastaliq ascenders or descenders (buttons, cards, overflow containers).
- [ ] Urdu punctuation ۔ ، ؟; no letter-spacing, uppercase or italics on Urdu.
- [ ] Headings at most 3 lines on 360px and no single-word last line.

**Conversion**
- [ ] Hero WhatsApp visible without scrolling at 360×800 and 390×844.
- [ ] Every WhatsApp link opens with the right prefilled message + ref code; private items use the neutral message and `PRV`.
- [ ] Sticky bar on every page < 990px; it never covers content (body padding is correct).
- [ ] Call links use `tel:+923216393999`.

**Accessibility**
- [ ] Skip link works; one H1; landmarks present; focus visible everywhere; targets ≥ 48px.
- [ ] Contrast pairs only from design-system §1; alt text in both languages; `lang` set on mixed snippets.

**Content & compliance**
- [ ] No `[PENDING]`/`[CONFIRM]` text visible (unless `show_dev_placeholders` is on).
- [ ] Notices present under paralysis, hepatitis, diabetes and depression; disclaimer in the footer.
- [ ] No banned words; no AI-generated person shown as real.

**Performance**
- [ ] LCP element = hero image, preloaded, correct size per breakpoint.
- [ ] No request to Google Maps before tapping the map.
- [ ] Budgets met (JS, CSS, fonts, images).

## 4. When Lighthouse is low
1. Check the LCP element and its size (`summary.md` lists it).
2. Check that the font preload matches the language actually used.
3. Look for render-blocking CSS/JS and oversized images.
4. Re-run once: simulated throttling varies ±3 points; we use the median of 3 runs.
