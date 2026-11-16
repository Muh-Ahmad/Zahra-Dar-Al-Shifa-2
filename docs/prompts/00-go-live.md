# Session 0 — GO LIVE (v0: the one-page site, same day)

**Start:** the kit is on GitHub (`main` and `staging`) and the cloud environment `zds-shopify` is set up (`docs/tech/cloud-setup.md` §0–3). claude.ai/code → repository `Zahra-Dar-Al-Shifa` · branch `staging` · environment `zds-shopify` · mode **Accept edits** → paste:
> Read docs/prompts/00-go-live.md and follow it exactly.

---

You are the lead engineer of the Zahra Dar Al-Shifa Shopify theme. Goal of this one session: **v0**, a correct, fast, bilingual one-page site that Ahmad can publish today. v0 = the full homepage of `homepage-blueprint.md` (header · hero · about · medicines & treatments · contact · footer · sticky bar) in Urdu at `/` and English at `/en`, with only confirmed facts. With no products published yet, section 3b shows its empty state (`medicines.empty`).

This session replaces stages S1–S3 for the first launch. It follows `docs/prompts/02-setup.md` and `docs/prompts/03-homepage.md` with the same quality bar (CLAUDE.md applies throughout), with these differences only:
- no grey wireframe (S1 Part B) and no style guide page (02-setup §6); both move to the next stage;
- one short look-and-feel checkpoint (Checkpoint A) and one final gate (Gate B);
- a proof-read sheet for Major Sahab, and the v0 launch check `npm run qa:launch:v0`.

Ahmad is a beginner and is present today. Keep messages short and plain. Never publish a theme: Ahmad does that himself in Shopify admin.

## Part 0 — Read and check (about 15 minutes)
1. Read `CLAUDE.md` and every file in its "Read before any task" table, plus `docs/assets-checklist.md`, `docs/prompts/02-setup.md`, `docs/prompts/03-homepage.md` and `docs/tech/v0-scope.yml`. Read Skeleton's rules with `tar -xzOf vendor/skeleton-theme-a7a655e.tgz skeleton-theme/AGENTS.md`.
2. Environment table (print only "set" or "missing" for variables, never values): `node -v` (≥ 22.19), `shopify version` (5.x), `"$CHROME_PATH" --version`, `git branch --show-current`, `SHOPIFY_FLAG_STORE`, `SHOPIFY_CLI_THEME_TOKEN`, `STORE_PASSWORD`, `REVIEW_THEME`, `CHROME_PATH`, and `shopify theme list --json` (proves the token and the network allowlist; name any blocked host exactly).
3. If anything is missing or blocked: STOP. Tell Ahmad in plain words exactly what to fix and where (the `cloud-setup.md` section), then wait.
4. List which files from `docs/assets-checklist.md` exist in `src/assets/` and `docs/reference/`.

## Part 1 — Branch, packages, short plan
1. `git switch -c claude/go-live`.
2. `npm install`; commit `package-lock.json`. `node scripts/build-locales.mjs` must succeed and `npm run qa:static` must PASS.
3. Write `docs/plan.md` (short): the environment table, every `[PENDING]`/`[CONFIRM]` item as a table (item · file · blocks which stage · who decides), and the stage checklist with `[ ]` boxes: v0 GO-LIVE · S2b style guide + wireframe · S4 PRODUCTS & WHATSAPP/COD ORDERING · S5 TRACKING & SEO · S6 LANDING PAGES (only if Ahmad approves them) · S7 POLICIES, 404 & LEGAL PAGES · S8 HARDENING · S9 FULL LAUNCH CHECK. Commit.

## Part 2 — Theme foundation
Do `docs/prompts/02-setup.md` §1 to §5 exactly (starting theme, clean-up and dialect, locales, tokens/CSS/fonts/icons, document shell, snippets, header and footer). Skip §6 (style guide). Also:
- If `src/assets/brand/logo-zds-gold-disc.png` exists and is not truly transparent (no alpha channel, or a checkerboard painted in), fix it with `node scripts/logo-cutout.mjs <file> <same path>` and commit. Never edit the cream-disc file: it is already a true cut-out.
- `npm run images`.
One commit per item, as 02-setup says.

## Part 3 — Hero, then Checkpoint A (look and feel)
1. `templates/index.liquid` with the four `container` blocks of `03-homepage.md` §1; build `zds-hero` first (03-homepage §2), leaving the other three blocks as empty shells for now.
2. `npm run check`, `npm run qa:static`, `npm run push:review`.
3. `npm run qa:shots -- --devices mobile,desktop --no-full`, then `npm run qa:review -- --title "GO-LIVE · Checkpoint A"` and publish `qa/review.html` as an artifact.
4. Post to Ahmad: the 4 first-screen screenshots (Urdu and English, mobile 390 and desktop 1440), the artifact link, and this line: **"Checkpoint A: is the look right? Reply `ok`, or send up to 5 numbered changes."** STOP and wait.
5. Apply his changes (copy changes go through copy.yml), re-shoot, and continue once he has written `ok`.

## Part 4 — The rest of the homepage
Do `docs/prompts/03-homepage.md` §2 (`zds-about`, `zds-medicines-treatments`, `zds-contact`), §3 (JavaScript and `scripts/test-links.mjs`) and §4 (SEO) exactly. One commit per block.

## Part 5 — Gate B (final review)
1. Run the full QA gate of `03-homepage.md` §5 (`qa-gate` skill): check, qa:static, push:review, shots, Lighthouse on `/` and `/en`, `node scripts/test-links.mjs`, then the subagents compliance-reviewer → urdu-rtl-reviewer → qa-auditor. Fix every BLOCKER and MAJOR.
2. `npm run qa:proofread` → `qa/proofread.html`. Publish it as an artifact: this is the **proof-read sheet** Major Sahab reads on a phone. It numbers every Urdu text and every fact that v0 shows, and lists the items that need his yes or no.
3. `npm run qa:launch:v0` and report the result. Before Major Sahab's approval it is expected to FAIL only on `[PROOF-READ]` / `[CONFIRM]` lines inside the v0 scope. Any other failure must be fixed now.
4. `npm run qa:review -- --title "GO-LIVE · Gate B"`, publish it as an artifact, commit (`chore(qa): go-live gate B`) and push `claude/go-live`.
5. Post the gate report in the CLAUDE.md format, plus a short section **"To go live, Major Sahab must:"** with the proof-read sheet link and the open yes/no items in plain words. Tell Ahmad how to answer:
   - `Major Sahab approved all`, or
   - `Major Sahab approved, with corrections: 7: <correct Urdu> · 12: <correct Urdu>` (numbers from the sheet), plus the answers to the yes/no items.
   STOP and wait.

## Part 6 — Apply Major Sahab's answer, then hand over
1. Apply every correction exactly as written (Urdu in copy.yml, facts in facts.yml). If a correction would break `compliance.md`, do not apply it: explain why in one sentence and offer a compliant wording for approval.
2. Remove the `[PROOF-READ]` marker from every v0-scope line Major Sahab approved, and resolve each answered `[CONFIRM]` (set the value, or keep it hidden). Never remove a marker he did not approve.
3. `node scripts/build-locales.mjs` → `npm run check` → `npm run qa:static` → `npm run qa:launch:v0` (must PASS) → `npm run push:review` → `node scripts/test-links.mjs` → `npm run qa:shots`. Commit and push.
4. Post **"READY TO PUBLISH"** with these steps for Ahmad, in plain words:
   1. In this session's **Changes** card: create the pull request into `staging` and merge it.
   2. On GitHub: Pull requests → New pull request → base `main` ← compare `staging` → Create → Merge.
   3. Shopify: connect `main` and publish it (`cloud-setup.md` §5). Plan B if it fails: publish `zds-review` and rename it `ZDS live`.
   4. Turn the storefront password off, connect the domain, then Search Console and Google Business Profile (`cloud-setup.md` §6).
   5. Send the live address back to this session.
   STOP.

## Part 7 — Live check (when Ahmad sends the live address)
1. `node scripts/shots.mjs --base https://<domain> --prefix live --devices mobile,desktop` and `node scripts/lighthouse.mjs --base https://<domain> --launch` (the crawlability audit now runs).
2. Open `/`, `/en`, one WhatsApp link and the Call link; confirm the WhatsApp number and ref code.
3. Commit the results, push, and post a 5-line live report: working or not, scores, anything to fix in the next stage. Then tick v0 in `docs/plan.md`.
