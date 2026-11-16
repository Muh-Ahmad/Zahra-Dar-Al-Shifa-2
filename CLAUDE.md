# CLAUDE.md — Zahra Dar Al-Shifa (زہرا دار الشفاء) · Shopify theme

You are building the website of a herbal clinic in Lahore, Pakistan.
- **Approver of all medical wording and Urdu:** Maj. (R) Hakeem Syed Nasir Abbas (the herbalist). The team calls him **Major Sahab**; "Major Sahab approved" means his approval.
- **Your human in every session:** Muhammad Ahmad Gondal ("Ahmad"). He reviews each gate on his phone.

## Mission
The fastest, highest-converting bilingual Shopify theme: **Urdu (RTL, default, at `/`) + English (at `/en`)**.
Conversions, in priority order: 1) WhatsApp chat 2) phone call 3) clinic visit 4) COD order.
Most visitors arrive from Meta ads on mid-range Android phones. **Conversion beats decoration.**

## Read before any task (sources of truth, never contradict them)
| Need | File |
|---|---|
| Facts: names, credentials, phone, address, hours, specialties, products, flags | `docs/brand/facts.yml` (the ONLY place facts live) |
| Every visible word, Urdu + English | `docs/content/copy.yml` |
| What we may and may not say or show | `docs/content/compliance.md` |
| Voice, logo, imagery | `docs/brand/brand.md` |
| Tokens, typography, components | `docs/design-system/design-system.md` |
| Homepage layout (authoritative) | `docs/design-system/homepage-blueprint.md` |
| Stack, repo, branches, theme files, RTL, performance budgets | `docs/tech/architecture.md` |
| Theme dialect (Skeleton block-first rules; project exceptions in architecture.md §4) | `docs/tech/skeleton-AGENTS.md` (copied from the Skeleton theme in SETUP) |
| Events, pixels, UTM, WhatsApp ref codes | `docs/tech/tracking.md` |
| QA gate, screenshots, Lighthouse | `docs/tech/qa.md` |
| Cloud environment, env vars, allowlist | `docs/tech/cloud-setup.md` |
| Expected image/logo filenames | `docs/assets-checklist.md` |
| What the v0 (go-live) site shows; its launch check | `docs/tech/v0-scope.yml` |
| Session prompts (`00-go-live.md` = launch the one-page v0 in one day) | `docs/prompts/` |

## Golden rules (never break)
1. **No invented facts.** Values marked `[PENDING]` or `[CONFIRM]` in facts.yml are exported as empty strings and must render nothing on the site. Never guess numbers, credentials, prices, days, quotes or reviews. List every pending item you touched in the gate report.
2. **Words come only from copy.yml.** Need a new string? Add it to copy.yml (ur + en) with `# [PROOF-READ]`, run `node scripts/build-locales.mjs`, then use it. Never hand-edit `locales/*.json`. Urdu must read as natural Urdu, not translated English.
3. **Compliance is law** (`docs/content/compliance.md`): no cure/guarantee/permanent/"100% safe" claims, no sexual-performance wording, no before/after, no invented testimonials, no condition names sent to ad pixels. Run the `compliance-reviewer` subagent on every diff that touches copy, images, products or tracking.
4. **Real people only.** Never present an AI-generated person as Major Sahab, staff or a patient. People images must be files marked REAL in `docs/assets-checklist.md`; otherwise use the neutral apothecary placeholder (no person).
5. **RTL first.** CSS logical properties only (`margin-inline-start`, `inset-inline-end`, `text-align: start`). Wrap every left-to-right run inside Urdu text (phone numbers, prices, times, dates, "3/1 B-Commercial", Latin names, codes) with the `zds-bdi` snippet. Never letter-space, uppercase, italicise or justify Urdu.
6. **Protect the live store.** It is a paid Shopify Basic store; Ahmad alone publishes themes, in Shopify admin. Never run `shopify theme publish`, `shopify theme delete`, `shopify theme push` with `--live`/`--publish`/`--allow-live`, `git push --force`, or a direct push to `main`/`staging`. Push only to the review theme in `$REVIEW_THEME` (`npm run push:review`). The hook `.claude/hooks/guard.sh` enforces this.
7. **Performance budgets** (architecture.md) are acceptance criteria. No sliders, no hero video, no jQuery, no frameworks, no new app or third-party script without Ahmad's written OK.
8. **Small commits.** One logical change per commit, Conventional Commits (`feat(hero): …`, `fix(rtl): …`). Push the branch often. Do not run `gh pr create` (GraphQL is blocked in cloud sessions); tell Ahmad to open the PR from the session's Changes card.
9. **Stop at every approval gate.** Never start the next stage until Ahmad writes "approved".

## Environment (Claude Code cloud session)
- Env vars (set in the cloud environment, never in git): `SHOPIFY_FLAG_STORE`, `SHOPIFY_CLI_THEME_TOKEN`, `STORE_PASSWORD`, `REVIEW_THEME`, `CHROME_PATH`, `SHOPIFY_CLI_NO_ANALYTICS=1`, `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`. Never print their values.
- A blocked host means the network allowlist needs it: report the exact hostname to Ahmad (see `docs/tech/cloud-setup.md`). Do not route around it.
- The starting theme is vendored (`vendor/skeleton-theme-a7a655e.tgz`), so SETUP needs no GitHub clone. Do not upgrade it without Ahmad's OK.

## Commands
```bash
node scripts/build-locales.mjs   # copy.yml + facts.yml → locales/ur.json + locales/en.default.json
npm run dev           # shopify theme dev on http://127.0.0.1:9292
npm run check         # shopify theme check (must be 0 errors)
npm run qa:static     # physical-CSS scan, banned words, locale parity, pending report
npm run push:review   # push the working tree to the review theme ($REVIEW_THEME); creates it if missing; saves id + preview URL to qa/.review-theme.json
npm run qa:shots      # Playwright screenshots of the review theme → qa/screenshots/latest (+ manifest.json, console.txt)
npm run qa:lh         # Lighthouse mobile, median of 3 → qa/lighthouse/latest/summary.md
npm run qa:review     # one-page review gallery qa/review.html (publish as an artifact for Ahmad)
npm run images        # responsive WebP variants from src/assets → assets/
npm run qa:proofread  # qa/proofread.html: numbered Urdu texts, facts and yes/no questions for Major Sahab (publish as an artifact)
npm run qa:launch:v0  # v0 launch check: fails on any [PROOF-READ]/[CONFIRM]/[VERIFY] the v0 site shows (docs/tech/v0-scope.yml)
npm run qa:launch     # full launch check (S8): fails on every marker left anywhere
npm run logo:cutout -- <in> <out.png>   # true transparent copy of a round logo with a painted checkerboard
```

## Definition of done (every task)
- `npm run check` 0 errors · `npm run qa:static` passes · no browser console errors.
- Checked at 360, 390, 768, 1024 and 1440 px, in **Urdu and English**.
- Homepage Lighthouse mobile: Performance ≥ 90, Accessibility/Best Practices/SEO ≥ 95, LCP ≤ 2.5 s, CLS ≤ 0.05, TBT ≤ 200 ms.
- Subagents run: `compliance-reviewer` (copy, images, products, tracking), `urdu-rtl-reviewer` (anything visible in Urdu), `qa-auditor` (before every gate). All BLOCKER/MAJOR findings fixed.
- facts.yml / copy.yml unchanged, or every change listed in the gate report.

## Approval gate format (post exactly this, then stop)
1. **What changed:** 3–6 bullets.
2. **Preview:** `https://$SHOPIFY_FLAG_STORE/?preview_theme_id=<id>&pb=0` and the `/en/` version (storefront password required).
3. **Screenshots:** committed files in `qa/screenshots/latest/` (mobile 390 + desktop 1440, ur + en, fold + full page), plus the review artifact link if published.
4. **QA table:** theme check, qa:static, Lighthouse (Perf/A11y/BP/SEO, LCP, CLS, TBT), subagent verdicts.
5. **Open items:** every `[PENDING]` / `[CONFIRM]` / `[PROOF-READ]` touched, and each decision you need from Ahmad.
6. "Waiting for your approval."

## When unsure
Ask one precise question. Never guess a fact, a medical claim or Urdu wording.
