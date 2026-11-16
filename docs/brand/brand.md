# Brand guide — Zahra Dar Al-Shifa (زہرا دار الشفاء)

Facts (names, credentials, contact, hours) live only in `docs/brand/facts.yml`. Words live only in `docs/content/copy.yml`.
The herbalist, Maj. (R) Hakeem Syed Nasir Abbas, is called **Major Sahab** by the team. "Major Sahab approved" in a chat means he approved it.

## Major Sahab's credentials at a glance (from his documents, 2026-11-14)
| | Status | Use |
|---|---|---|
| Registered **Tabeeb**, National Council for Tibb (Govt. of Pakistan), Reg. No. QH-45342-A, since 2022, valid to 18 May 2030 | ✅ Verified (two NCT licences) | Site (About, footer) as text, schema, ads, print. No certificate photo |
| **Fazil-ut-Tibb-wal-Jarahat** (four-year Unani course), Jinnah Unani Medical College, Sheikhupura, exam 2012 | ✅ Verified (NCT diploma, 2013) | Site, schema, print |
| 12+ years' experience | ✅ Consistent with the 2012/13 qualification | Everywhere |
| Retired Major | Stated by Ahmad (no document seen) | Site and print |
| PhD (framed copy: University of Hong Kong, 1998) | ⛔ Unverified: the copy has errors | Nowhere until verified (compliance.md §6) |
| Clinic premises: PHC registration | ⏳ Not provided yet | Nowhere until we have the number |

Public name: **میجر (ر) حکیم سید ناصر عباس** / **Maj. (R) Hakeem Syed Nasir Abbas**. Unani (Tibb) is the system he is licensed for, so the brand says "herbal (Unani) medicine", never homeopathy.

## Positioning
**For** Urdu-speaking adults in Lahore (mostly 35–65+) living with long-term pain, digestive or private health problems,
**Zahra Dar Al-Shifa** is a registered herbal clinic where an experienced hakeem listens fully and prepares a **personal herbal prescription**,
**unlike** generic "joint oils" sold online, because every patient is assessed first, treated with time-tested herbs, and spoken to in **complete confidence**.

## Promise pillars (use in this order)
1. **Experience:** 12+ years, one accountable herbal physician.
2. **Personal prescription:** a separate نسخہ and diet plan for every patient.
3. **Pure herbs:** natural, traditional, time-tested.
4. **Complete confidentiality:** men's and women's health discussed privately.
5. **Spiritual guidance on request:** Quranic verses and Masnoon supplications, offered alongside treatment, never instead of it.

## Voice
- Warm, respectful, calm authority. Always address the reader as **آپ**.
- Short sentences. One idea per sentence. No hype, no fear, no exclamation marks in Urdu body text.
- Promise care, guidance and relief; never promise a cure (see compliance.md).
- Islamic greeting (السلام علیکم) belongs in WhatsApp messages, not in every headline.

## Taglines
| Tagline | Status |
|---|---|
| قدرتی علاج، پُرسکون زندگی | ✅ Primary (footer, social bios) |
| دوا بھی، دعا بھی | ✅ Allowed on site (About, spiritual section). Not in ads. |
| روحانی و جسمانی امراض کا شافی علاج | ⛔ Restricted: "شافی" implies cure. Not on the website or in ads unless compliance sign-off changes. |

## Logo
- Use only the master files in `src/assets/brand/`. Never redraw, re-letter, recolour, stretch, rotate or regenerate the logo with AI.
- The logo PNGs received so far have a fake "transparent" checkerboard painted into the pixels. `logo-zds-cream-disc.png` in the kit is a true transparent copy, cut along the disc edge with `scripts/logo-cutout.mjs`; every pixel inside the disc is unchanged. Use the same script for the gold-disc file. Ask the designer for a real transparent or SVG master when possible.
- **Cream-disc logo** on dark and light backgrounds; **gold-disc logo** only on near-black backgrounds.
- **Size (decision 2026-11-05):** the "25–30% width" rule from print and ads applies to the **mobile hero**: `clamp(96px, 28vw, 132px)`. On desktop, 30% of the screen would be huge, so the header logo is 120px; on inner pages the compact header uses 56px. Footer: 96px.
- Clear space: at least 15% of the logo diameter on every side.

## Imagery
- **People:** real photographs only (Major Sahab, staff, consenting patients with faces hidden). No AI-generated people presented as real. No stock "doctor in white coat" models.
- **Look:** warm natural daylight, apothecary textures (wood, brass, glass jars, dried herbs), calm and uncluttered. Grade slightly warm with deep-green shadows.
- **Products:** on an ivory or cream plinth, soft shadow, 4:5. Renders are allowed only if the printed packaging looks exactly the same.
- **Never:** before/after, close-ups of diseased body parts, graphic anatomy photos, pills spilling, clocks/"timing" symbols, couples in intimate poses.
- **Illustration:** engraved botanical line art and simple line icons (the knee, leaf and walking-person icons from the approved oil label) are fine.

## Product family references
Approved designs in `docs/reference/`: the معدہ و جگر pouch, the joint oil label and the bottle sheet. Website product cards must look like the same family (ivory, deep green, antique gold).

## Decision log
| Date | Decision | Why |
|---|---|---|
| 2026-11-05 | Urdu is the default language at `/`; English at `/en`. | The audience reads Urdu first, and ads link to Urdu pages. |
| 2026-11-05 | Ivory reading surfaces; dark green-black hero, contact and footer; gold only for actions. | An all-dark site hurts Nastaliq readability for 45+ readers. |
| 2026-11-05 | The logo 25–30% rule applies to the mobile hero only. | Keeps headers usable. |
| 2026-11-05 | The COVID-19 pause is internal history, not public copy. | No conversion value; it could raise doubt. |
| 2026-11-05 | Commerce is consult-first: WhatsApp ordering on, cart off (`cart_enabled: false`). | Regulatory status of the products is unconfirmed (compliance.md §5). |
| 2026-11-05 | Private conditions share the neutral code PRV and a neutral WhatsApp message. | Privacy on shared phones and in notifications. |
| 2026-11-05 | No hero or homepage testimonials until real, consented ones exist. | Trust and law. |
| 2026-11-14 | Go live with **v0** (the one-page bilingual homepage) as soon as Major Sahab approves its Urdu; products, landing pages, tracking and policies follow in stages. | The clinic needs a working link now. Nothing unconfirmed is shown, so an early launch costs no trust. |
| 2026-11-14 | Shopify **Basic** plan, owned by the clinic's own Google account from day one (no development-store transfer). | The clinic owns its store, domain and data; one less step at launch. |
| 2026-11-14 | Ad and print artwork (pamphlets, the knee-oil template) is never used on the site as an image with words in it; its motifs are rebuilt in code (design-system §6–7). | Speed, Google, accessibility and the language switch. |
| 2026-11-14 | The logo masters are true transparent cut-outs of the approved files (`scripts/logo-cutout.mjs`). | The received files had a checkerboard painted in. |
| 2026-11-14 | Public title «حکیم» / "Hakeem", not «ڈاکٹر» / "Dr.", until the PhD is verified. | His NCT licences say Hakeem/Tabeeb; that title is fully provable. |
| 2026-11-14 | The hero trust line says «رجسٹرڈ طبیب» (registered Tabeeb), not "registered clinic". | NCT registers the person; the clinic's PHC registration is still pending. |
| 2026-11-14 | Joint oil name: «شفاء المفاصل» (Shifa-ul-Mafasil), always followed by "herbal joint massage oil". | Final label design; the descriptor keeps the name from reading as a cure claim. |
| 2026-11-14 | Major Sahab's answers: title «حکیم»; rank shown as «ریٹائرڈ میجر» only; no certificate photo on the site; spelling "Canal Gardens"; WhatsApp is answered after 8 pm too. | Recorded from Ahmad's message. |
| 2026-11-14 | The Umang helpline number is removed; the depression notice points to Rescue 1122 and the nearest hospital. | Ahmad did not recognise the number; only verified numbers are shown. |
| 2026-11-14 | A real portrait of Major Sahab (white shalwar kameez, cream wall) is the About photo and the mobile hero until the desk photos are shot. | A real face builds trust; no AI person is ever shown as him. |
