# Compliance rules (law for this project)

This file decides what the website, product pages, WhatsApp messages and ads may say or show.
It is a practical rulebook, **not legal advice**. Before launch, Major Sahab should confirm product and clinic status with the relevant authorities and, ideally, a Pakistani lawyer.

**Why it matters:** Meta rejects or bans health ads that break its policies. Pakistan's drug regulator (DRAP) regulates herbal/Unani products and has asked the PTA to block websites selling unregistered medicines. Clinics in Punjab must be licensed by the Punjab Healthcare Commission (PHC). And one exaggerated claim can lose a patient's trust for good.

## 1. Claims: say "care, guidance, relief", never "cure"
| ✅ Use | ⛔ Never use |
|---|---|
| قدرتی علاج، نسخہ، رہنمائی، معاون علاج، آرام کے لیے، صحت کے لیے | مکمل شفا، 100% شفا، گارنٹی، ضمانت، مستقل علاج، جڑ سے خاتمہ |
| "herbal care", "supportive", "for relief in", "guidance" | cure, guaranteed, permanent, miracle, instant relief, 100% safe, no side effects |
| "results vary from person to person" | any promise of a timeline ("in 6 weeks", "in 7 days") |
| "alongside your doctor's treatment" | "no need for a doctor / surgery / your medicines" |

"100% Natural Ingredients" may appear **only if literally true** (no synthetic additives or preservatives); see facts.yml `label_claim [CONFIRM]`.

## 2. Banned words (machine-checked by `npm run qa:static`)
One term per line. Latin terms match whole words, case-insensitive. Urdu terms match as written.
<!-- banned:start -->
- مکمل شفا
- سو فیصد شفا
- 100% شفا
- یقینی شفا
- یقینی علاج
- گارنٹی
- ضمانت
- مستقل علاج
- ہمیشہ کے لیے نجات
- درد سے نجات
- جڑ سے خاتمہ
- شافی علاج
- معجزاتی
- کوئی سائیڈ ایفیکٹ نہیں
- بغیر سائیڈ ایفیکٹ
- آپریشن کی ضرورت نہیں
- ڈاکٹر کی ضرورت نہیں
- دوائیں چھوڑ دیں
- مردانہ کمزوری
- مردانہ طاقت
- جنسی
- ٹائمنگ
- جادو
- جنات
- تعویذ
- عملیات
- cure
- cures
- cured
- guarantee
- guaranteed
- permanent cure
- permanent relief
- miracle
- 100% safe
- no side effects
- side-effect free
- clinically proven
- instant relief
- FDA approved
- DRAP approved
- sexual
- stamina
- potency
- timing
- erectile
- enlargement
- black magic
- jinn
- taweez
<!-- banned:end -->

## 3. Condition rules
| Specialty | On the website | Required notice (copy key) | Meta ads |
|---|---|---|---|
| Joint pain, Stomach & liver, Spine | Normal tile + WhatsApp CTA | none | ✅ Allowed (statement-style copy, §4) |
| Paralysis & facial palsy | "Supportive care during recovery" only | `treatments.notices.paralysis` (stroke = emergency, 1122) | ⛔ |
| Hepatitis | "Supportive liver care alongside your doctor" | `treatments.notices.hepatitis` | ⛔ |
| Diabetes | "Supportive guidance and diet" | `treatments.notices.diabetes` (never stop medicines) | ⛔ |
| Depression | "Spiritual and herbal support" | `treatments.notices.depression` (Rescue 1122 + nearest hospital) | ⛔ |
| Men's health, Women's health, Childlessness | Only inside the **Private consultation** card; neutral code PRV; neutral WhatsApp message | childlessness: `treatments.notices.childlessness` | ⛔ Never |

Never describe sexual function, performance, size, timing or "power" anywhere: site, product names, alt text or file names.

## 4. Meta (Facebook/Instagram) ad rules
- **Personal attributes:** an ad must not assert or imply that the viewer has a health condition.
  - ⛔ "گھٹنوں کا درد ہے؟" · "سیڑھیاں چڑھنا چھوٹ گیا؟" · "نماز میں اٹھنا بیٹھنا مشکل ہے؟" · "Do you have joint pain?"
  - ✅ "جوڑوں کے درد کے لیے قدرتی جڑی بوٹیوں کا نسخہ" · "گھٹنوں کے درد میں قدرتی آرام — 12 سال کا تجربہ" · "سیڑھیاں، نماز، چہل قدمی — جوڑوں کی صحت کے لیے قدرتی علاج"
- No before/after images, no zoomed "problem" body parts, no sexual-health products or wording, no miracle claims.
- The landing page must match the ad: same condition, same offer, same words.
- Ads only for specialties with `ads_allowed: true` in facts.yml.
- Each ad gets its own WhatsApp ref code (tracking.md §5) so chats can be traced to ads.

## 5. Products, DRAP and online selling
- Herbal, Unani and homoeopathic products are regulated by DRAP (DRAP Act 2012 and the Alternative Medicines and Health Products (Enlistment) Rules 2014; DRAP is moving these to a new online licensing and registration system).
- **Until each product's regulatory status is confirmed** (facts.yml `regulatory_status`):
  - `cart_enabled: false`: no Add to cart and no checkout. Products show "Order on WhatsApp" only.
  - Products are framed as **recommended after a consultation** (`product_ui.consult_only`).
- Products tagged `consult-only` never get an Add to cart button, even after the cart is enabled.
- Every product page must show: ingredients, directions, warnings (oil: `products.external_use_warning`), size, and the enlistment or registration number when one exists. Product photos must match the real packaging.
- Never sell or show products for sexual problems online.
- **Product names that contain «شفا» (healing):** the joint oil's name «شفاء المفاصل» (Shifa-ul-Mafasil) is kept as a traditional Unani-style brand name. Always print and write it as a **name**, followed by what the product is: «شفاء المفاصل — جوڑوں کی مالش کا ہربل روغن» / "Shifa-ul-Mafasil herbal joint massage oil". Never translate it ("joint cure"), never put it in a sentence that promises a result, and lead ads with the consultation, not the name. DRAP may question a name that implies a cure during enlistment, so keep a plain fallback name ready.
- **Label benefits:** «اکڑن میں آرام» and «پٹھوں کے کھچاؤ سے راحت» are fine. «درد سے نجات» ("freedom from pain") reads as a promise that the pain will go: change it to «درد میں آرام» before the label is printed. On the website, only the softer wording is used (the banned list enforces it).
- **Back label checklist (for printing, not the website):** product name and what it is, net volume, ingredients, directions, «صرف بیرونی استعمال کے لیے» and the other warnings in `products.external_use_warning`, batch number, manufacturing and expiry dates, manufacturer's name and address, and the DRAP enlistment number once issued.

## 6. Credentials and registration (updated 2026-11-14 from Major Sahab's documents)
**Verified by documents** (safe to show): registered **Tabeeb** with the **National Council for Tibb, Government of Pakistan**, Reg. No. **QH-45342-A** (registered 2022, licence valid until 18 May 2030); qualification **Fazil-ut-Tibb-wal-Jarahat** (four-year course), **Jinnah Unani Medical College, Sheikhupura**, examination 2012. Stated by Ahmad: retired Major.
- **Title:** use «حکیم» / "Hakeem" (his NCT licences say Hakeem / Tabeeb). «ڈاکٹر» / "Dr." is not used until the PhD is verified (`title_dr_allowed` in facts.yml). After that, "Dr." is always followed by the role, so nobody mistakes him for an MBBS doctor. Never write MBBS, specialist, consultant physician or surgeon.
- **PhD:** not shown on the site, in ads or in print until it is verified independently (HEC Pakistan degree equivalence, or a confirmation letter from the university's Registry). The framed copy must never be photographed for marketing: its Chinese text contains errors that anyone who reads Chinese would notice, and a doubtful credential on a health website invites complaints to PHC and damages trust far more than having no PhD line.
- **"Registered":** say «رجسٹرڈ طبیب» / "NCT-registered hakeem" (the person). Never say "registered clinic" until the clinic premises have their own **Punjab Healthcare Commission (PHC)** registration; its number is `clinic.registration_number`.
- **Registration number** (`show_registration`, default on): About and footer show the council and QH-45342-A. Renew before 18 May 2030.
- **Certificate photo:** none on the website (Major Sahab's decision, 2026-11-14); the registration number is shown as text. Never publish the documents, the CNIC or the home address anywhere.
- Retired rank: "Maj. (R)" / "میجر (ر)".

## 7. Testimonials and reviews
- Only real patients, with **written consent** (form below), first name + area or initials, no face unless consented.
- No outcome promises; always add `about.testimonials_note` (results vary).
- Never write, edit the meaning of, or AI-generate a testimonial, review, voice note or face. Never pay or reward patients for reviews.
- Keep signed consent forms (photo or paper) for as long as the testimonial is online.

Consent form (print or WhatsApp): # [PROOF-READ]
> میں اجازت دیتا / دیتی ہوں کہ زہرا دار الشفاء میرا تجربہ / میری تصویر اپنی ویب سائٹ اور سوشل میڈیا پر استعمال کرے۔ میرا چہرہ اور پورا نام ☐ دکھایا جائے ☐ نہ دکھایا جائے۔ میں یہ اجازت کسی بھی وقت واپس لے سکتا / سکتی ہوں۔
> نام: ______ فون: ______ دستخط: ______ تاریخ: ______

## 8. Imagery
- No AI-generated person presented as Major Sahab, staff or a patient. AI renders are allowed for packaging only when they match the printed product.
- No before/after, no graphic anatomy photos, no images of intimate situations.
- Anatomy illustrations (engraved knee, line icons) are fine.

## 9. Spiritual guidance wording
- ✅ "قرآنی آیات اور مسنون دعاؤں کے ذریعے روحانی رہنمائی، مریض کی خواہش پر"
- ⛔ jinn, jadu/black magic, taweez, amliyat, "guaranteed dua", or any fee for dua. Healthcare laws in Pakistan treat fortune-telling and magic-style "healing" as quackery; keep spiritual guidance clearly optional and alongside treatment.

## 10. Privacy and data
- The website never asks for a patient's condition in a form. Conversations happen on WhatsApp or the phone.
- **Ad pixels never receive condition data.** Meta gets only `Contact` / `FindLocation` events with the channel name. Private pages and specialties use the neutral code `PRV` everywhere.
- Prefilled WhatsApp messages for private matters are neutral ("رازدارانہ مشورہ"), so nothing sensitive shows in a phone notification.
- WhatsApp Business labels must not name private conditions (use "Private", "Follow-up").
- Order notes and Shopify customer tags must not contain diagnoses.

## 11. Required disclaimers (where they appear)
| Text (copy.yml key) | Where |
|---|---|
| `footer.disclaimer` | Footer of every page, in the current language |
| `footer.emergency` | Footer of every page |
| `treatments.notices.*` | Under the matching specialty, homepage and landing pages |
| `products.external_use_warning` | Oil product page and card |
| `about.testimonials_note` | Under any testimonial |

## 12. Review workflow
1. Claude runs the `compliance-reviewer` subagent on every copy, image, product or tracking diff.
2. Ahmad checks the gate report.
3. Major Sahab reads every `[PROOF-READ]` line and confirms every `[CONFIRM]` before launch (`npm run qa:launch` must pass).
