# Session 3 — HOMEPAGE

**Start:** after the SETUP pull request is merged into `staging`: new session · branch `staging` · environment `zds-shopify` · mode **Accept edits** → paste:
> Read docs/prompts/03-homepage.md and follow it exactly.

---

Goal: the complete homepage in the exact order of `homepage-blueprint.md` (1 Hero · 2 About · 3 Medicines & treatments · 4 Contact) in Urdu (`/`) and English (`/en`), with tracking hooks, structured data and every performance budget met. No landing pages: they need Ahmad's approval first.

## 0. Before you start
`git pull` · `git switch -c claude/homepage` · `npm run images` (process whatever photos exist and list what is still missing from `docs/assets-checklist.md`) · re-read `homepage-blueprint.md`, design-system.md §6–7, tracking.md §2–5 and compliance.md §3 and §11.

## 1. templates/index.liquid
Four `container` blocks in this order and nothing else, each wrapping one block:
```liquid
{% block 'container', tag: 'section', id: 'top', class: 'zds-section zds-section--hero', labelledby: 'hero-title' %}{% block 'zds-hero' %}{% endblock %}{% endblock %}
```
then `about` (`zds-about`), `medicines` (`zds-medicines-treatments`) and `contact` (`zds-contact`) the same way. Add `{% render 'zds-jsonld-person' %}` to this template (homepage only).

## 2. Blocks (one commit each, following the blueprint exactly)
- **zds-hero** (blueprint §1): H1 `hero.headline_a` or `hero.headline_b` (setting `hero_variant`), eyebrow, sub, WhatsApp primary (`whatsapp.home`, location `hero`, page code `HOME`), Call secondary with the phone in `zds-bdi`, trust line. Images and preload per the blueprint's "Images" and "LCP" lines: `snippets/zds-preload-hero.liquid` in the head on the homepage only; Urdu desktop uses `hero-doctor-desk-3x2-left`, English `-3x2-right`; fallback order real photo → apothecary placeholder → botanical SVG. Hide `hero.sub` below 375 px. Mobile hero logo `clamp(96px,28vw,132px)`.
- **zds-about** (blueprint §2): credentials list with only confirmed rows (role, experience, rank, PhD, council), three pillars, spiritual guidance block, registration row only with `show_registration`, testimonials wrapper only with `show_testimonials` (none exist: render nothing and invent nothing), quote only when `facts.quote` is not empty. Portrait `doctor-portrait-4x5` when it exists, otherwise no image (never a stand-in person).
- **zds-medicines-treatments** (blueprint §3): 3a loops over `facts.specialties_public`, then one private card (`whatsapp.private`, code `PRV`, `treatments.notices.childlessness` inside it). Each specialty goes through `snippets/zds-specialty-item.liquid`: number, name, one-liner (`treatments.items.<key>`), WhatsApp link (`whatsapp.specialty` with the specialty name, page code = its code, location `specialty`) and its notice when not empty. 3b: products from a block setting (collection, default `all`, at most 6) through `snippets/zds-product-card.liquid` with every card rule in the blueprint; empty state `medicines.empty` + WhatsApp button.
- **zds-contact** (blueprint §4): address block (Urdu address + landmark, English line, copy button announced with `aria-live`), hours (and days once confirmed), phone, WhatsApp (`whatsapp.visit`, page code `VST`), Call, Directions only when `facts.maps_url` is set (`data-zds-channel="directions"`), map facade only when `facts.maps_embed_src` is set (`assets/zds-map-facade.svg`, iframe injected on tap), `contact.after_hours`.

## 3. JavaScript and a link test
Add the map facade to `assets/zds-core.js`. Then write `scripts/test-links.mjs` (Playwright, same unlock and preview logic as `scripts/shots.mjs`) and run it against the review theme. It must assert:
- `/?utm_source=facebook&utm_content=A1`: the hero WhatsApp link opens `wa.me/` + `facts.whatsapp_number` (read the number from `locales/ur.json`; never type it) and its text ends with `کوڈ: HOME-FB-A1`;
- the private card's link uses `whatsapp.private` and a `PRV-` code, with no condition word in the URL;
- every `tel:` link equals `facts.phone_e164`;
- `zds:contact_click` is published with the right channel, location and page code (wrap `Shopify.analytics.publish` in the test page);
- both JSON-LD blocks parse with `JSON.parse` and contain no empty values;
- exactly one `h1` on `/` and on `/en`.

## 4. SEO
`meta.home_title` and `meta.home_description` on `/` and `/en`; hreflang: check what Shopify outputs and add tags only if they are missing; `zds-jsonld-person` per seo.md.

## 5. QA gate (use the `qa-gate` skill)
- `npm run qa:shots` → home-ur and home-en × mobile 390, Android 360 and desktop 1440 × first screen and full page.
- `npm run qa:lh` → on `/` and `/en`: Performance ≥ 90, Accessibility, Best Practices and SEO ≥ 95, LCP ≤ 2.5 s, CLS ≤ 0.05, TBT ≤ 200 ms.
- `node scripts/test-links.mjs` → all assertions pass.
- Subagents: compliance-reviewer → urdu-rtl-reviewer → qa-auditor. Fix every BLOCKER and MAJOR.
- Gate report in the CLAUDE.md format with the mobile 390 and desktop 1440 screenshots in Urdu and English (first screen + full page), the review artifact link, every pending fact that renders nothing yet, and the headline A/B note (`hero_variant`). STOP and wait for "approved".
