# One-time setup (Ahmad): do these before the first session

Who owns what (decision 2026-11-14): the **clinic** owns the store, the domain and every account below, through one clinic Google account. Ahmad builds and runs them. Major Sahab pays.

## 0. Clinic Google account (10 minutes)
- Create a new Gmail for the clinic, e.g. `zahradaralshifa.clinic@gmail.com` (any free name close to the brand).
- Turn on **2-Step Verification** with Major Sahab's phone, and add Ahmad's phone as the backup.
- Keep the password in a password manager (or written and kept safe) where both of you can reach it.
- Use this account for Shopify, the domain, Google Business Profile, Search Console and GA4. Later, Meta Business too.

## 1. Shopify store (Basic plan)
1. shopify.com → **Start free trial** → sign up with the **clinic Gmail**. Skip the setup questions.
2. Store name: `Zahra Dar Al-Shifa`. If Shopify lets you choose the `xxxx.myshopify.com` address, pick a clean one (e.g. `zahradaralshifa`). Visitors will not see it once the domain is connected, but Claude's settings use it (`SHOPIFY_FLAG_STORE`).
3. Settings → Plan → **Basic** → pay with Major Sahab's card (international online payments must be switched on in the bank app). On Shopify's Pakistan pricing page (checked 2026-11-14): 3 days free, then **$1/month for 3 months**, then **$25/month** billed monthly or **$19/month** billed yearly (USD, plus the bank's currency charges). [VERIFY] the price at checkout.
4. Settings → General: currency **PKR**, time zone **(GMT+05:00) Karachi**.
5. Settings → Languages: add **Urdu**, make it the **default**, keep **English published**. Install **Translate & Adapt** (by Shopify).
6. No automatic language or country redirection anywhere (Markets settings, geolocation apps), so visitors from ads always land on Urdu `/`.
7. Online Store → Preferences: keep **password protection on** until Major Sahab approves v0. That password = `STORE_PASSWORD`.
8. Settings → Checkout: customers check out with phone number or email; shipping-address phone = **required** (couriers need it for COD).
9. Settings → Payments: add the manual method **Cash on Delivery (COD)** later, when delivery is decided.
10. Install **Theme Access** (by Shopify) → Create password → name it `claude-code`, send it to the clinic email → open the email link (it works only once) → copy the password (starts with `shptka_`). That password = `SHOPIFY_CLI_THEME_TOKEN`. Never paste it into a chat.
11. Staff: new Basic stores have no staff accounts (2026). Today, Ahmad uses the clinic login. Later, Ahmad creates a free **Shopify Partner** account and requests **collaborator access** to the store; Major Sahab approves it in Settings → Users. Then Ahmad logs in as himself.

## 2. GitHub
1. Repo `Zahra-Dar-Al-Shifa`, **private**, created with **Add a README file** ticked (cloud sessions need a repository with at least one commit).
2. Put the kit on `main`, choosing one of these ways:
   - **Easiest:** ask Claude in chat to commit the kit to the repo for you.
   - **GitHub Desktop** (free app): File → Clone repository → open the folder → copy in everything from the unzipped kit (on a Mac, press Cmd + Shift + . in Finder to show hidden files) → "Commit to main" → "Push origin".
   - ⚠️ Avoid drag-and-drop on github.com: it often skips the hidden files `.claude/`, `.gitignore` and `.shopifyignore`. If you used it, check they appear on GitHub.
3. Create the branch `staging` from `main`.
4. Settings → Branches → protection rules for `main` and `staging`: require a pull request before merging.
5. claude.ai/code → connect GitHub and install the Claude GitHub App on this repo.

## 3. Claude Code cloud environment
claude.ai/code → environment selector (under the message box) → **New environment** → name `zds-shopify`.

**Network access: Custom**, tick **"Also include default list of common package managers"**, then Allowed domains:
```
*.myshopify.com
shopify.com
*.shopify.com
*.shopifycdn.com
*.shopifyapps.com
shopify.dev
*.shopify.dev
googlechromelabs.github.io
cdn.playwright.dev
playwright.download.prss.microsoft.com
```
Why: Shopify CLI and Theme Access traffic, Shopify docs, the Chrome for Testing version list (`googlechromelabs.github.io`), Playwright fallback. Chrome itself downloads from `storage.googleapis.com` (already in the default list); fonts come from npm packages, so no font CDN is needed. If Claude reports another blocked host, add exactly that host.

**Environment variables** (`.env` format; anyone using this environment can read them, so keep it personal):
```
SHOPIFY_FLAG_STORE=your-store.myshopify.com
SHOPIFY_CLI_THEME_TOKEN=shptka_xxxxxxxxxxxxxxxx
STORE_PASSWORD=your-storefront-password
REVIEW_THEME=zds-review
CHROME_PATH=/usr/local/bin/chrome-cft
SHOPIFY_CLI_NO_ANALYTICS=1
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
```

**Setup script** (runs as root before Claude starts; the result is cached for about 7 days when it finishes within about 5 minutes, so the three installs run in parallel):
```bash
#!/bin/bash
# ZDS cloud setup: Shopify CLI 5 + Chrome for Testing + the system libraries Chrome needs.
( npm install -g @shopify/cli@5 > /tmp/zds-shopify-cli.log 2>&1 ) &
( npx -y @puppeteer/browsers@3 install chrome@stable --path /opt/cft > /tmp/zds-chrome.log 2>&1 ) &
( npx -y playwright@1.64.1 install-deps chromium > /tmp/zds-pw-deps.log 2>&1 ) &
wait
CHROME_BIN="$(ls -d /opt/cft/chrome/*/chrome-linux64 2>/dev/null | head -1)/chrome"
[ -x "$CHROME_BIN" ] && ln -sf "$CHROME_BIN" /usr/local/bin/chrome-cft
exit 0
```
The cloud VM is Ubuntu 24.04 with Node 22 on `PATH`. Shopify CLI 5 needs Node ≥ 22.12 and Lighthouse 13 needs Node ≥ 22.19; the first session checks this and reports.

## 4. First session (go live, v0)
claude.ai/code → repo `Zahra-Dar-Al-Shifa`, branch `staging`, environment `zds-shopify`, mode **Accept edits** → send:
`Read docs/prompts/00-go-live.md and follow it exactly.`
(If you are not launching early, start with `docs/prompts/01-plan.md` in **Plan** mode instead.)

## 5. Connect the live theme to GitHub (at go-live, after the v0 pull requests are merged into `staging` and `main`)
Shopify → Online Store → Themes → Add theme → **Connect from GitHub** → log in to GitHub and allow the Shopify app on this repo → choose `Zahra-Dar-Al-Shifa` and the branch `main`. Shopify creates a theme synced with `main`. Preview it, then **Publish** it yourself (Claude never publishes).
- Never save anything in the theme editor or code editor of this theme (architecture.md §3).
- Plan B, if connecting fails: publish the `zds-review` theme instead and rename it `ZDS live` (architecture.md §3).

## 6. Domain, password and Google (go-live day)
**Do you need Hostinger?** Not for hosting: Shopify hosts the website. You only need a **domain name**, bought in one of two places:
| | Buy in Shopify (Settings → Domains → Buy new domain) | Buy at Hostinger (domain only, no hosting plan) |
|---|---|---|
| Setup | Automatic, connected in minutes | You add 3 DNS records (below) |
| Price | Shown before you pay; renews on the Shopify bill | Often cheaper in year 1; compare the **renewal** price |
| Owner | The clinic's Shopify account | Use a Hostinger account made with the clinic Gmail |
| Good for | Going live today with no technical steps | Cheaper long term, more DNS control |

Connecting a Hostinger domain (Shopify's manual method):
- Hostinger → Domains → your domain → **DNS / Nameservers** → keep Hostinger's own nameservers.
- **A** record, name `@` → `23.227.38.65` (delete any other `@` A record).
- **AAAA** record, name `@` → `2620:0127:f00f:5::` (delete any other `@` AAAA record).
- **CNAME** record, name `www` → `shops.myshopify.com` (some panels want a final dot: `shops.myshopify.com.`).
- Shopify → Settings → Domains → **Connect existing domain** → type the domain without `www` → Connect. It can take up to 48 hours, usually much less. Make the bare domain (or `www`) the **primary** domain.

After Major Sahab approves v0 and the theme is published:
- Online Store → Preferences → turn **password protection off**.
- Google Search Console (with the clinic Gmail): add the domain, verify it with a DNS TXT record, submit `https://<domain>/sitemap.xml`.
- Google Business Profile: set the website to `https://<domain>/` (the same name, address and phone as the site).
- Meta domain verification happens in S5 (TRACKING & SEO).
