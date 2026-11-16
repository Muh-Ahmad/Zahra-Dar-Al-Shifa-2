# Homepage blueprint (authoritative layout spec)

**Fixed order:** Header → 1 Hero → 2 About → 3 Medicines & treatments → 4 Contact → Footer, plus the sticky mobile bar on every page. Do not add, remove or reorder these homepage sections. In code each one is a block (`zds-hero`, `zds-about`, `zds-medicines-treatments`, `zds-contact`) wrapped in a `container` in `templates/index.liquid` (architecture.md §4).
Copy keys: `docs/content/copy.yml`. Facts: `docs/brand/facts.yml`. Tokens and components: `design-system.md`.

**Borrowed from the inspiration site (feel only):** full-bleed photography with text over a soft scrim; alternating asymmetric image/text splits; generous whitespace; small eyebrow labels with thin hairlines; product "plinth" grid on a light ground; heritage storytelling; restrained motion.
**Not borrowed:** its content, imagery, logo, typefaces or pixel layout; carousels and sliders; autoplay video; mega-menus; newsletter pop-ups; tiny low-contrast text.

Breakpoints: 360 · 390 · 768 · 1024 · 1440 (container max 1320px).

## 0. Header
- **Mobile, homepage:** transparent over the hero, not sticky. Logo centred, width `clamp(96px,28vw,132px)` (the brand's 25–30% rule). Language switch at the top inline-end corner. No hamburger menu: four sections need no menu, and the footer holds the anchors.
- **Desktop, homepage:** transparent over the hero. Logo centred, 120px. Inline-start: anchors (`nav.about`, `nav.medicines`, `nav.contact`). Inline-end: language switch + small WhatsApp button (gold, 44px).
- **Other pages:** compact ink-950 bar: logo 56px, language switch, WhatsApp button.

## 1. Hero (`id="top"`)
**Goal:** within 5 seconds the visitor knows who, what and where, and taps WhatsApp.

**Mobile (< 768):**
- Height `calc(100svh - 64px - env(safe-area-inset-bottom))`, min 560px, max 860px.
- Image: real photo of Major Sahab (desk or consulting), 4:5 crop, face in the top third; scrim per design-system §7.
- Content anchored at the bottom, padding-inline 20px, padding-bottom 24px, in this order:
  1. `hero.eyebrow` (gold-500)
  2. H1 `hero.headline_a` or `_b` (setting `hero_variant`), ivory, at most 3 lines
  3. `hero.sub` (stone-300), at most 3 lines; hidden below 375px wide if it would exceed 3 lines
  4. Primary CTA: WhatsApp, full width, 56px, `hero.cta_whatsapp`
  5. Secondary CTA: Call, full width, 52px, `hero.cta_call` + ` · ` + phone in `zds-ltr`
  6. `hero.trust_line` (small, stone-300)

**Tablet (768–1023):** the desktop 3:2 photo, mobile content order, the two CTAs side by side.

**Desktop (≥ 1024):** full-bleed 3:2 photo (max height 860px), scrim from inline-start; content column at inline-start, max width 560px, 96px from the bottom; the two CTAs side by side. The subject must sit at inline-end, so each language has its own photo: Urdu pages use `hero-doctor-desk-3x2-left` (Major Sahab in the left third, text on the right), English pages `hero-doctor-desk-3x2-right`. Never mirror a photo.

**Images:** mobile `hero-doctor-desk-4x5`; desktop as above (assets-checklist.md). **Mobile fallback before the desk photo exists:** the real portrait `doctor-portrait-4x5` (in the kit since 2026-11-14; alt text `about.portrait_alt`). Until real photos exist, use `placeholder-apothecary-4x5` / `-3x2` (no person). If neither exists, use a CSS/SVG botanical line-art pattern on ink-950 (no person, no logo redrawing); the H1 then becomes the LCP element.

**LCP:** the hero image is the LCP element. Use `<picture>` with art direction (mobile 4:5: 480/768w only, so phones stay within the 120 KB budget; ≥ 768: 3:2 at 1080/1440/1920w), `fetchpriority="high"`, no lazy-loading, and `<link rel="preload" as="image" imagesrcset imagesizes media>` for the matching breakpoint and the current language only.

**Acceptance:** the WhatsApp button is visible without scrolling at 360×800 and 390×844 (with the sticky bar showing); LCP ≤ 2.5s; no text over the face; every hero text ≥ 4.5:1 contrast against the scrim.

## 2. About (`id="about"`): ivory-50
**Mobile:** section header (`about.eyebrow`, `about.heading`) → portrait 4:5 (full width) → `about.body_1`, `about.body_2` → credentials list (`about.credentials_heading`; rows in this order, each label `about.cred_*` or `about.registration_label` + its value: practice `facts.role` · qualification `about.qualification_value` · registration `about.registration_value` (+ `about.certificate_link` to the redacted certificate only when `facts.certificate_public` is "yes") · experience `facts.experience` · military service `facts.rank` · PhD only when `facts.phd` is not empty; empty rows never render) → `about.body_3` under the credentials → 3 pillars stacked → spiritual guidance as a quiet block on ivory-100 (`about.spiritual_*`) → registration row (only if `show_registration`) → testimonials (only if `show_testimonials`; none exist, so do not create examples) → quote (only when `about.quote` is non-empty).
**Desktop:** 12 columns; text in columns 1–6 at inline-start, portrait in columns 8–12 at inline-end; pillars beneath as 3 columns with a gold top hairline.
**Acceptance:** name, role (`facts.role`), the NCT registration and experience appear within the first screen and a half of this section on mobile.

## 3. Medicines & treatments (`id="medicines"`): ivory-100
### 3a. Specialties
- Source and order: `facts.yml → specialties`. Public specialties as rows/tiles, then **one** Private consultation card for all private ones.
- Each item opens WhatsApp with `whatsapp.specialty` (specialty name) + ref code `{CODE}-{SRC}`. The private card uses `whatsapp.private` + code `PRV`.
- Safety notices (`treatments.notices.*`) sit directly under paralysis, hepatitis, diabetes and depression; the childlessness notice sits inside the private card.
- **Mobile:** section header + `treatments.intro` → list rows (design-system §6) → private card.
- **Desktop:** 2×2 featured tiles (joints, stomach & liver, spine, paralysis), the remaining public specialties as a 3-column compact list, the private card as a full-width dark band.

### 3b. Medicines (Shopify products)
- `medicines.heading` + `medicines.note`; products from a collection setting (default: `all`), at most 6.
- Card rules: "Order on WhatsApp" always (`whatsapp.product` + code `PRD-{handle}`); "Add to cart" only if `enable_cart` and the product is not tagged `consult-only`; price only if `show_prices` and price > 0, otherwise `product_ui.price_on_request`; `external-use` tag shows the badge.
- No product for a private condition ever appears here.
- Empty collection: hide the grid and show `medicines.empty` with a WhatsApp button.
- **Mobile:** 1 column of horizontal cards. **Desktop:** 3 columns of vertical cards.

## 4. Contact (`id="contact"`): ink-950
**Mobile:** section header (`contact.eyebrow`, `contact.heading`) → address block (Urdu address + landmark, English line, "Copy address") → hours (+ days when confirmed) → phone (`zds-ltr`) → buttons stacked: WhatsApp (primary, `whatsapp.visit` + code `VST-{SRC}`), Call, Directions (opens `facts.maps_url`) → map facade 16:10 → `contact.after_hours`.
**Desktop:** details in 5 columns at inline-start, map in 7 columns at inline-end.
**Pending states:** no `maps_embed_src` → no facade; no `maps_url` → no Directions button (the address still shows).
**Acceptance:** the copy-address button works and announces success; the map iframe is not requested before a tap; every number is LTR-isolated.

## 5. Footer: ink-950
Cream-disc logo 96px · `footer.tagline` · anchors · policy links · `footer.disclaimer_title` + `footer.disclaimer` (current language) · `footer.emergency` · `footer.registration` (only if confirmed) · `footer.rights`. On mobile, bottom padding = sticky bar height + safe area.

## 6. Sticky mobile bar (< 990px, every page)
64px + `env(safe-area-inset-bottom)`. Two equal buttons: WhatsApp (gold, glyph + `sticky.whatsapp`) and Call (ink-900, ivory, phone icon + `sticky.call`). Always visible. Each tap publishes `zds:contact_click` with `location: "sticky"`. On ≥ 990px it is hidden; the header WhatsApp button and an optional floating WhatsApp button (56px, inline-end, 24px from the bottom, setting `show_desktop_whatsapp_fab`) take over.

## 7. Motion and empty states
- Below-the-fold reveal only (design-system §4). The `js` class is added first, so content stays visible without JS.
- No real hero photo → neutral apothecary placeholder (no person), same crops.
- Pending facts → render nothing; the review theme can show dashed placeholders when `show_dev_placeholders` is on.
