# Tracking & attribution

Goal: know which ad, page and button produced each WhatsApp chat, call, visit and order, **without ever sending health conditions to ad platforms**.
Because the clinic converts mostly inside WhatsApp, the website cannot see the outcome. So we combine three layers:
1. **Ref codes** inside every prefilled WhatsApp message (works even if pixels are blocked or restricted).
2. **Website events:** GA4 + Meta via Shopify's official apps and one custom pixel.
3. **A simple lead log** kept by whoever answers WhatsApp (date, code, booked?, came?, bought?, amount).

Meta has restricted conversion data for some health & wellness advertisers since 2025, and effects vary by category and region. Treat pixel data as a bonus; ref codes and the lead log are the ground truth.

## 1. Platforms setup (Ahmad, in Shopify admin)
- **Facebook & Instagram app** (by Meta): connect the Business Manager, Pixel and catalog; data sharing = Maximum (adds the Conversions API). Verify the domain in Business Manager at launch (DNS TXT at Hostinger).
- **Google & YouTube app:** connect GA4. In GA4 mark `whatsapp_click` and `call_click` as key events.
- **Custom pixel:** Settings → Customer events → Add custom pixel → paste `integrations/custom-pixel.js` → fill in the IDs from facts.yml (`tracking.*`) → Connect. Customer privacy setting: not required for Pakistan visitors [CONFIRM in admin].

## 2. Event taxonomy
Theme publishes one custom event: `zds:contact_click` with `customData`:
| Field | Values |
|---|---|
| `channel` | `whatsapp` · `call` · `directions` |
| `location` | `hero` · `header` · `sticky` · `fab` · `specialty` · `private` · `product_card` · `contact` · `footer` |
| `page_code` | `HOME` · `PRD` · `VST` · specialty code (`JNT`, `SLV`, `SPN`, `PRL`, `HEP`, `SGR`, `DEP`) · `PRV` for every private item |
| `lang` | `ur` · `en` |

| Where it goes | Event | Parameters |
|---|---|---|
| GA4 | `whatsapp_click` / `call_click` / `directions_click` | `zds_location`, `zds_page_code`, `zds_lang`, `page_location` |
| Meta | `Contact` (WhatsApp, call) · `FindLocation` (directions) | `content_name` = channel **only**. No page codes, no conditions. |
Standard commerce events (view, add to cart, checkout, purchase) come from the official apps automatically.

## 3. Theme side (implement in `assets/zds-core.js`)
```js
// Publish a contact click (validated names only; never put condition names in data).
function zdsTrack(channel, location, pageCode) {
  try {
    if (window.Shopify && Shopify.analytics && Shopify.analytics.publish) {
      Shopify.analytics.publish('zds:contact_click', {
        channel, location, page_code: pageCode, lang: document.documentElement.lang || 'ur'
      });
    }
  } catch (e) { /* tracking must never break a click */ }
}
// Markup contract: <a href="https://wa.me/…" data-zds-channel="whatsapp" data-zds-location="hero" data-zds-page-code="HOME">
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-zds-channel]');
  if (a) zdsTrack(a.dataset.zdsChannel, a.dataset.zdsLocation, a.dataset.zdsPageCode);
}, { capture: true });
```

## 4. UTM & attribution capture
- On every page load read `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid`.
- Store `{first, last}` touch in `localStorage['zds_attr']` with a timestamp; expire after 30 days; wrap in try/catch.
- When the cart is enabled: copy the last touch + ref code into cart attributes (`/cart/update.js`) so orders show them under "Additional details".

## 5. WhatsApp ref codes
Format `{PAGE}-{SRC}[-{AD}]`, uppercase A–Z, 0–9 and `-`, at most 20 characters.
- `PAGE` = `page_code` (table above; products use `PRD-` + a short handle, e.g. `PRD-OIL`).
- `SRC` from `utm_source`: facebook/fb → `FB` · instagram/ig → `IG` · google → `GG` · whatsapp → `WA` · tiktok → `TT` · gbp → `GBP` · no UTM but a referrer → `ORG` · nothing → `DIR`.
- `AD` = `utm_content` (short ad id such as `A1`), if present.
- Appended to the prefilled text on a new paragraph using `whatsapp.ref` ("کوڈ: JNT-FB-A1").
- Server-rendered links contain the message without the code; JS adds the code (progressive enhancement).
- Encode text with `encodeURIComponent` (spaces become `%20`). In Liquid use `| url_encode | replace: '+', '%20'`.
- **Click-to-WhatsApp ads** (no website): put the code directly in the ad's prefilled message, e.g. `السلام علیکم! مجھے جوڑوں کے درد کے بارے میں مشورہ درکار ہے۔ کوڈ: AD-J1`.

## 6. Lead log (receptionist)
WhatsApp Business: greeting message, away message (outside 2–8 pm), quick replies, and labels **New**, **Booked**, **Visited**, **Ordered**, **COD confirmed**, **Follow-up** (never label a condition).
Daily sheet columns: `date · code · new/returning · booked (y/n) · visited (y/n) · order (y/n) · amount PKR · note (no diagnosis)`.

## 7. Testing before launch
- Meta Events Manager → Test events: `Contact` fires once per WhatsApp/Call click with `content_name` only.
- GA4 DebugView: `whatsapp_click` with the right `zds_page_code`.
- Open `/?utm_source=facebook&utm_content=A1`, tap the hero WhatsApp button: the message ends with `کوڈ: HOME-FB-A1`.
- Private card: the message is `whatsapp.private` and the code is `PRV-…`; Meta receives no page code.
