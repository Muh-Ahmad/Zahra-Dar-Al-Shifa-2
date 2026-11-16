# Asset checklist (exact file names)

Upload each file to the folder shown, with exactly this name (GitHub → the folder → **Add file → Upload files**).
Status: **HAVE** = already exists · **SHOOT** = real photo to take · **ASK** = request from the designer · **MAKE** = Claude builds it from existing files in a later stage · **RENDER** = AI image allowed (never a person).
Claude never invents a person, a logo or a certificate (CLAUDE.md golden rules 1 and 4).

## src/assets/brand/ (logo masters: never AI-generated, redrawn or recoloured)
| File | What | Format | Status |
|---|---|---|---|
| `logo-zds-cream-disc.png` | Approved logo on the cream disc (most backgrounds) | transparent PNG, ≥ 1200 px | ✅ IN THE KIT (1763 px, true transparency, cut out 2026-11-14) |
| `logo-zds-gold-disc.png` | Approved logo on the gold disc (near-black backgrounds only) | transparent PNG, ≥ 1200 px | HAVE → upload. ⚠️ Probably has the same painted checkerboard: run `node scripts/logo-cutout.mjs <file> src/assets/brand/logo-zds-gold-disc.png` (Claude does this in SETUP) |
| `logo-zds-master.svg` | Vector master | SVG | ASK the designer. If none exists, keep the PNGs; nobody traces the logo |
| `logo-zds-mono-ivory.svg` | One-colour ivory version for dark bands | SVG | ASK (optional) |
| `favicon-zds.png` | Square emblem for the browser tab | PNG 512×512, transparent | MAKE (square crop of the cream-disc logo, no redrawing) |
| `og-zds-1200x630.jpg` | Share image for WhatsApp/Facebook links: real photo + logo + clinic name | JPG 1200×630 | MAKE in S5 (TRACKING + SEO) |

## src/assets/images/ (photos: JPG, long side ≥ 2400 px, original quality)
| File | Subject and framing | Crop | Must be REAL | Status | Used in |
|---|---|---|---|---|---|
| `hero-doctor-desk-4x5.jpg` | Major Sahab at his desk, warm smile, looking at the camera; face in the top third | portrait 4:5 | ✅ | SHOOT | Hero, mobile |
| `hero-doctor-desk-3x2-left.jpg` | Same scene, landscape, Major Sahab in the **left third**, calm space on the right | landscape 3:2 | ✅ | SHOOT | Hero, desktop, Urdu |
| `hero-doctor-desk-3x2-right.jpg` | Same scene, Major Sahab in the **right third**, calm space on the left | landscape 3:2 | ✅ | SHOOT | Hero, desktop, English |
| `doctor-portrait-4x5.jpg` | Head and shoulders, plain clinic background, looking at the camera | 4:5 | ✅ | ✅ IN THE KIT (real photo from Major Sahab, cropped 1688×2110, 2026-11-14) | About; mobile hero until the desk photo exists |
| `doctor-consulting-3x2.jpg` | Major Sahab listening to a patient; the patient's face not visible (back or side) and consent signed | 3:2 | ✅ | SHOOT | About, landing pages |
| `clinic-exterior-signboard.jpg` | Building and readable signboard in daylight | 3:2 | ✅ | SHOOT | Contact, Google Business Profile |
| `clinic-reception.jpg` | Reception area, tidy, no visitors | 3:2 | ✅ | SHOOT | About, GBP |
| `clinic-consultation-room.jpg` | Consultation room, chair and desk | 3:2 | ✅ | SHOOT | About, GBP |
| `clinic-medicine-shelves.jpg` | Shelves of jars and herbs | 3:2 | ✅ | SHOOT | Medicines section |
| `herbs-flatlay-3x2.jpg` | Dried herbs, roots and jars on dark wood, top-down | 3:2 | real or RENDER | SHOOT or RENDER (no person) | Decorative background |
| `certificate-phd.jpg` | — | — | — | ⛔ DO NOT ADD: the PhD is unverified (compliance.md §6) | Nowhere |
| `certificate-registration-*.jpg` | — | — | — | ⛔ NOT USED: Major Sahab chose no certificate photo on the site (2026-11-14) | Nowhere |
| — | Unredacted certificates, CNIC, home address | — | — | ⛔ NEVER in this repo, the site, ads or chats | — |
| `product-joint-oil-4x5.jpg` | Final oil bottle with the printed label, cream plinth, soft shadow | 4:5 | photo, or a RENDER that matches the printed bottle exactly | SHOOT or RENDER (bottle being designed 2026-11-14) | Product card |
| `product-joint-oil-cutout.png` | The same bottle alone, front view, label straight and readable, no shadow, **real transparent background** (no painted checkerboard) | PNG, bottle ≥ 2000 px tall | same rule | MAKE (from the final bottle design) | Product page, landing page, future ads |
| `product-joint-oil-dropper-4x5.jpg` | Dropper pose of the same bottle | 4:5 | same rule | SHOOT | Product page |
| `product-stomach-liver-4x5.jpg` | معدہ و جگر pouch, front | 4:5 | same rule | SHOOT | Product card |
| `product-joint-tablets-4x5.jpg` | Joint tablets with their real pack | 4:5 | same rule | SHOOT | Product card |
| `placeholder-apothecary-4x5.jpg` | Apothecary still life (jars, herbs, brass mortar), **no person**, dark green and wood | 4:5 | no (RENDER allowed) | RENDER | Hero until real photos exist |
| `placeholder-apothecary-3x2.jpg` | Same, landscape, objects grouped in the centre, calm space on both sides | 3:2 | no (RENDER allowed) | RENDER | Desktop hero until real photos exist |

## docs/reference/ (references only, never shipped)
| File | What | Status / note |
|---|---|---|
| `ref-pouch-stomach-liver.png` | Approved معدہ و جگر pouch design | HAVE → upload |
| `ref-oil-label-final.png` | Final approved oil label | HAVE once the name is final |
| `ref-oil-bottle-sheet.png` | Oil bottle product sheet (grey background) | HAVE → upload |
| `ref-pamphlet.png` | Clinic pamphlet | HAVE → upload. ⚠️ It shows the old address ("37 BC Commercial") and old hours (10 am–4 pm): facts.yml wins |
| `ref-ad-joint-pain.png` | Current joint-pain ad creative | HAVE → upload |
| `ref-oil-label-shifa-ul-mafasil.jpg` | Front label of «شفاء المفاصل» (2026-11-14), 1600 px reference copy | ✅ IN THE KIT. The product page (S4) uses a bottle photo or render that shows this label |
| `ref-ad-template-knee-oil.png` | Ivory/gold template with green ribbons, logo circle and knee · leaf · walking-person medallions (2026-11-14) | HAVE → upload. Style reference only: the site rebuilds the medallions and gold rules in code (design-system §6–7) |
| `inspiration-<site>-home-desktop.png` | Screenshot of the reference website Ahmad chooses (replaces raymond-weil.com, 2026-11-14); feel only, never copied | PENDING (Ahmad's choice) |
| `inspiration-<site>-home-mobile.png` | Same, mobile | PENDING |
| `competitor-01.png` … `competitor-03.png` | Screenshots of 2–3 competing herbal clinic sites or ads (optional) | optional |

## Product images for the website (every medicine, same rules)
1. **Final label first.** The label must already show the final, approved name ([CONFIRM] in facts.yml) and no unapproved claim (compliance.md). A wrong label photographed today has to be re-shot.
2. **Same look for the whole range:** the same camera angle (straight on, lens at label height), the same light, the same ivory/cream plinth, so the product grid looks like one family.
3. **Two files per product:** a 4:5 product shot (`product-<name>-4x5.jpg`) and a transparent cut-out (`product-<name>-cutout.png`).
4. **Size:** at least 2000 px on the long side. Claude makes the small, fast WebP versions; never send screenshots or WhatsApp-compressed photos.
5. **No text baked into product photos** (prices, offers, "100% natural" stamps): text goes in the page, where it can be translated and changed.
6. An AI render is allowed only when it matches the printed bottle exactly (brand.md → Imagery). Never show a person in a product render.

## v0 (go-live) minimum
- Must have: `logo-zds-cream-disc.png` (in the kit).
- Best: one **real** photo of Major Sahab (`hero-doctor-desk-4x5.jpg`, even from a phone, taken by the tips below).
- Otherwise: `placeholder-apothecary-4x5.jpg` + `placeholder-apothecary-3x2.jpg` (AI render, no person, no text, no logo).
- If none of these exist, the hero falls back to the botanical line-art pattern (homepage-blueprint §1). The site still launches.

## Placeholder render prompts (AI image allowed: no person, no text, no logo)
**`placeholder-apothecary-4x5.jpg`** (mobile hero; text sits over the bottom half):
> Photorealistic still life of a traditional herbal apothecary on a dark walnut counter: a brass mortar and pestle, amber glass jars of dried herbs, roots and seeds, a small pile of dried rose petals, a folded natural linen cloth. Deep green-black background. Warm natural window light from the upper side, soft shadows, calm and uncluttered, premium editorial look. All objects in the upper half of the frame; the lower half fades into dark wood and shadow with no objects. No people, no hands, no text, no labels, no logos, no bottles with printing. Vertical 4:5, high resolution, at least 2400 px tall.

**`placeholder-apothecary-3x2.jpg`** (desktop hero, both languages):
> The same apothecary still life in landscape: brass mortar and pestle, amber glass jars of dried herbs and roots, dried rose petals and linen on a dark walnut counter, deep green-black background, warm window light, soft shadows. Objects grouped tightly in the centre third; calm, empty dark space on the left and right thirds. No people, no hands, no text, no labels, no logos. Horizontal 3:2, high resolution, at least 2400 px wide.

Check every render before uploading: no letters or fake writing on jars, no extra hands or faces, nothing that looks like a real medicine label.

## Photo shoot tips (one hour, before the 2 pm opening, so no patients are present)
1. Daylight from a window, lights on, no harsh flash. Clean the desk; hide papers with patient names.
2. Phone on the normal 1× lens (wide-angle distorts faces), at chest height, gridlines on, focus on the eyes.
3. Shoot every scene in landscape **and** portrait. For the desk hero, take it twice: Major Sahab in the left third, then in the right third.
4. Wardrobe: plain dark or grey shalwar kameez (a waistcoat is fine). Skip the white coat and stethoscope [CONFIRM with Major Sahab]: on a herbal clinic site they suggest an MBBS doctor (compliance.md §6).
5. Anyone else in a photo signs the consent form (compliance.md §7) or stays unrecognisable.
6. Send the originals on WhatsApp as **Document** (not Photo, which compresses them), or upload them straight to GitHub.
7. Never flip a photo horizontally: signboards and certificates would read backwards.
