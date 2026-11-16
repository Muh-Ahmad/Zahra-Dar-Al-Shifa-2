// Zahra Dar Al-Shifa: Shopify custom pixel for contact clicks.
// Paste into Shopify admin → Settings → Customer events → Add custom pixel ("ZDS contact events") → Connect.
// Page views and commerce events come from the official Meta and Google apps; this pixel adds only contact clicks.
// IDs come from docs/brand/facts.yml → tracking.*
const GA4_ID = 'G-XXXXXXXXXX';          // [PENDING] tracking.ga4_measurement_id
const META_PIXEL_ID = '000000000000000'; // [PENDING] tracking.meta_pixel_id

// --- Google Analytics 4 (custom events only)
(function () {
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
  document.head.appendChild(s);
})();
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', GA4_ID, { send_page_view: false });

// --- Meta Pixel (standard events only; base pixel and Conversions API come from the Facebook & Instagram app)
!function (f, b, e, v, n, t, s) {
  if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
  if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
  t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
}(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', META_PIXEL_ID);

// Anyone can publish custom events from the browser console, so validate everything.
const CHANNELS = ['whatsapp', 'call', 'directions'];
const SAFE = (v) => String(v || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 24);

analytics.subscribe('zds:contact_click', (event) => {
  const d = event.customData || {};
  if (!CHANNELS.includes(d.channel)) return;
  const href = event.context && event.context.document && event.context.document.location
    ? event.context.document.location.href : undefined;

  // GA4: internal codes are fine (private items always use the neutral code PRV)
  gtag('event', d.channel + '_click', {
    page_location: href,
    zds_location: SAFE(d.location),
    zds_page_code: SAFE(d.page_code),
    zds_lang: SAFE(d.lang),
  });

  // Meta: standard events, channel only. Never send page codes or anything health-related.
  if (d.channel === 'directions') fbq('track', 'FindLocation');
  else fbq('track', 'Contact', { content_name: d.channel });
});
