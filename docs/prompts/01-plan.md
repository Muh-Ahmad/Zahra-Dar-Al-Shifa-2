# Session 1 — PLAN (plan mode → wireframe)

**Start:** claude.ai/code → repository `Zahra-Dar-Al-Shifa` · branch `staging` · environment `zds-shopify` · mode **Plan** → paste:
> Read docs/prompts/01-plan.md and follow it exactly.

> Launched the one-page site with `00-go-live.md`? Then skip this session: `docs/plan.md` already exists.

---

You are the lead engineer of the Zahra Dar Al-Shifa Shopify theme. This session plans the whole build and produces a grey-box homepage wireframe for approval. No theme code yet.

## Part A — in plan mode (read-only)
1. Read `CLAUDE.md` and every file in its "Read before any task" table, plus `docs/assets-checklist.md`, `docs/prompts/02-setup.md` and `docs/prompts/03-homepage.md`. `docs/tech/skeleton-AGENTS.md` does not exist yet: read the original with `tar -xzOf vendor/skeleton-theme-a7a655e.tgz skeleton-theme/AGENTS.md` and list the theme with `tar -tzf vendor/skeleton-theme-a7a655e.tgz`.
2. Check the environment and report it as a table. For variables print only "set" or "missing", never values:
   - `node -v` (need ≥ 22.19), `npm -v`, `shopify version` (need 5.x), `"$CHROME_PATH" --version`, `git status`, `git branch --show-current`
   - `SHOPIFY_FLAG_STORE`, `SHOPIFY_CLI_THEME_TOKEN`, `STORE_PASSWORD`, `REVIEW_THEME`, `CHROME_PATH`
   - `shopify theme list --json` (proves the Theme Access password and the network allowlist; if a host is blocked, name the exact host)
   - which files from `docs/assets-checklist.md` already exist in `src/assets/` and `docs/reference/`
3. Summarise the project in 10 bullets: audience, goal, conversion order, homepage order, languages, compliance limits, performance budgets, stack, workflow, biggest risks.
4. One table of every contradiction or gap you find between files, and every `[PENDING]`/`[CONFIRM]` item that blocks a stage: item · file · blocks which stage · who decides.
5. The stage plan, each stage with goal, main files, acceptance checks and gate:
   S2 SETUP · S3 HOMEPAGE · S4 PRODUCTS & WHATSAPP/COD ORDERING · S5 TRACKING & SEO · S6 LANDING PAGES (only if Ahmad approves them) · S7 POLICIES, 404 & LEGAL PAGES · S8 HARDENING (performance, accessibility, `npm run qa:launch`) · S9 LAUNCH (domain, store transfer; Ahmad publishes).
6. The theme file map from architecture.md §4 with one line per block and snippet, how the locale pipeline and feature flags work, and how you will keep the inlined CSS ≤ 12 KB.
7. At most 3 questions, and only ones that block SETUP. Present the plan with ExitPlanMode and wait.

## Part B — after Ahmad approves the plan (normal mode)
1. `git switch -c claude/plan`
2. Write `docs/plan.md`: the approved plan, a checklist per stage with `[ ]` boxes, the pending-items table and the Skeleton commit in use (`a7a655e`). Commit.
3. `npm install` and commit `package-lock.json`. Then `node scripts/build-locales.mjs` must succeed and `npm run qa:static` must PASS (no theme yet: it checks the content files). Do not commit the generated `locales/` yet; SETUP does that.
4. Build the grey-box wireframe as ONE static file, `qa/wireframes/home.html` (no Shopify):
   - Generate it with a small script, `scripts/wireframe.mjs`, that reads `docs/content/copy.yml` and `docs/brand/facts.yml` with the `yaml` package and fills the placeholders, so no copy is typed by hand. Pending facts are left out.
   - `<html lang="ur" dir="rtl">`; `?lang=en` switches to English and `dir="ltr"` (a few lines of inline JS).
   - Section order and mobile/desktop layouts from `homepage-blueprint.md`: header, hero, about, medicines & treatments (specialty rows, notices, private card, empty medicines state), contact, footer with the disclaimer, sticky bar.
   - Grey boxes with labels where images go. Only greys plus one gold for WhatsApp buttons: this approves order, hierarchy and copy length, not colours.
   - Fonts from `node_modules` (`@fontsource-variable/noto-nastaliq-urdu`, `/inter`, `/playfair-display`) with relative URLs; no font CDN.
5. Screenshots: `node scripts/shots.mjs --file qa/wireframes/home.html --prefix wire` (Urdu + English × mobile 390, Android 360, desktop 1440 × first screen + full page).
6. Run the `urdu-rtl-reviewer` subagent on the wireframe and its screenshots. Fix every BLOCKER and MAJOR, then re-shoot.
7. `npm run qa:review -- --title "PLAN · homepage wireframe"` and publish `qa/review.html` as an artifact.
8. Commit (`docs(plan): homepage wireframe + screenshots`) and push `claude/plan`.
9. Post the approval gate report in the CLAUDE.md format (the preview is the artifact link; there is no theme yet), including the mobile 390 and desktop 1440 screenshots in Urdu and English. STOP and wait for "approved".
