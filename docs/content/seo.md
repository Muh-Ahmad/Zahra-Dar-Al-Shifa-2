# SEO & local search plan

Facts: `docs/brand/facts.yml`. Words: `docs/content/copy.yml`. Rules: `docs/content/compliance.md`.
Search terms below may describe what people **search for**; page copy must still follow compliance.md (care, not cure).

## Keyword clusters
| Cluster | Urdu (script) | Roman Urdu | English | Target page |
|---|---|---|---|---|
| Brand | زہرا دار الشفاء، حکیم سید ناصر عباس | zahra dar ul shifa, hakeem nasir abbas | Zahra Dar Al-Shifa | Home |
| Local hakeem | حکیم لاہور، ہربل کلینک لاہور، دیسی علاج لاہور | hakeem in lahore, herbal clinic lahore, desi ilaj lahore | herbal clinic Lahore, hakeem near me, Canal Gardens clinic | Home |
| Joints | جوڑوں کے درد کا علاج، گھٹنوں کے درد کا دیسی علاج | joron ke dard ka ilaj, ghutno ke dard ka desi ilaj, joint pain ka ilaj | joint pain herbal treatment Lahore, knee pain oil | Home → Joints page (if approved) |
| Stomach & liver | معدے کا علاج، تیزابیت کا دیسی علاج، جگر کی صحت | mede ka ilaj, tezabiyat ka ilaj, jigar ka ilaj | herbal treatment for acidity Lahore | Home → Stomach/Liver page (if approved) |
| Spine | کمر درد کا علاج، مہروں کا درد | kamar dard ka ilaj, mehron ka dard | back pain herbal treatment | Home |
| Paralysis | فالج کے بعد بحالی، لقوہ | falij ka ilaj, laqwa ka ilaj | facial palsy herbal support | Home (with emergency notice) |
| Private (organic only, never ads) | بے اولادی کا علاج، مردانہ امراض، زنانہ امراض | be aulaadi ka ilaj, mardana amraz, zanana amraz | infertility herbal consultation Lahore | Private consultation page (if approved) |

## On-page rules
- One H1 per page, in the page language (Urdu H1 on `/`, English H1 on `/en`).
- Titles ≤ 60 characters, descriptions ≤ 155 characters (copy keys `meta.*`).
- `hreflang` alternates for `ur` and `en` plus `x-default` (Urdu). Verify Shopify outputs them; add them if not.
- URL handles in English or Roman Urdu (`/pages/joint-pain`), never Urdu script.
- Image file names are descriptive (`zds-hero-doctor-desk-768.webp`); alt text comes from copy.yml in both languages.
- Internal links: every specialty and product links to WhatsApp **and**, once landing pages exist, to its page.
- Roman Urdu belongs in landing-page FAQs (e.g. "joron ke dard ka desi ilaj kya hai?"), not stuffed into the homepage.

## Structured data (JSON-LD)
- **MedicalClinic** (a LocalBusiness subtype) on every page via `snippets/zds-jsonld-clinic.liquid`:
  name (Urdu) + alternateName (English), url, logo, image, telephone (`facts.phone_e164`),
  address (PostalAddress: streetAddress, addressLocality Lahore, addressRegion Punjab, addressCountry PK, postalCode when known),
  geo (only when the lat/lng are confirmed), openingHoursSpecification (only when the days are confirmed; opens 14:00, closes 20:00),
  sameAs (only confirmed profile URLs). **Omit every property whose fact is pending. Never output empty or placeholder values.**
- **Person** (Major Sahab) on the homepage: `name` "Syed Nasir Abbas", `honorificPrefix` "Hakeem" (not "Dr." until `title_dr_allowed`), `jobTitle` "Herbal physician (Tabeeb)", `worksFor` the clinic, `alumniOf` Jinnah Unani Medical College (Sheikhupura), `hasCredential`: (1) EducationalOccupationalCredential "Fazil-ut-Tibb-wal-Jarahat", (2) EducationalOccupationalCredential `credentialCategory` "license", `recognizedBy` National Council for Tibb, identifier QH-45342-A. Never a PhD until verified.
- **Product** on product pages: Liquid `{{ product | structured_data }}`. No `aggregateRating` until real reviews exist.
- Skip FAQPage schema (Google limits FAQ rich results to a few site types); FAQs are still useful as on-page content.

## Google Business Profile (GBP) alignment checklist
- [ ] Name exactly as on the signboard (facts.yml `brand.signboard_text`); no keywords added to the name.
- [ ] Address and pin match facts.yml exactly ("Canal Garden" vs "Canal Gardens" [CONFIRM]).
- [ ] Phone 0321-6393999; hours 2:00–8:00 pm on the confirmed days; holiday hours updated.
- [ ] Categories: primary "Herbalist" or the closest available herbal/alternative-medicine category; secondary "Homeopath" only if it applies [CONFIRM].
- [ ] Website link with UTM: `?utm_source=google&utm_medium=organic&utm_campaign=gbp`.
- [ ] Real photos: signboard, exterior, reception, consultation room, Major Sahab, products.
- [ ] Products added (same names and photos as Shopify); Q&A seeded with real common questions.
- [ ] Ask satisfied patients for reviews in person (never pay, never write them). Reply to every review without revealing health details.

## Measurement
- Google Search Console: verify the domain with a DNS TXT record at Hostinger once the domain exists; submit `/sitemap.xml`.
- Track: impressions/clicks for brand, "hakeem lahore" and the joints cluster; GBP calls, direction requests and website clicks.
