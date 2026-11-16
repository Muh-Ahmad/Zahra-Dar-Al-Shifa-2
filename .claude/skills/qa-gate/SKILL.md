---
name: qa-gate
description: Runs the full Zahra Dar Al-Shifa QA gate (locales, theme check, static QA, push to the review theme, screenshots, Lighthouse, the three reviewer subagents, review page) and posts the approval-gate report. Use at the end of every stage, or when Ahmad asks for QA, screenshots or "the gate".
---
# QA gate

Follow `docs/tech/qa.md` §1. In order:

1. If `docs/content/copy.yml` or `docs/brand/facts.yml` changed: `node scripts/build-locales.mjs`.
2. `npm run check` → 0 errors. Fix and repeat.
3. `npm run qa:static` → PASS. Fix and repeat.
4. Commit the work (small Conventional Commits), then `npm run push:review`. It prints the theme id and preview URL and saves them in `qa/.review-theme.json`.
5. `npm run qa:shots` (add `-- --pages "name=/path,…"` for the stage's extra pages). Every line must say `ok`.
6. `npm run qa:lh`. If a budget fails, fix it (`docs/tech/qa.md` §4) and go back to step 2.
7. Subagents, in this order: `compliance-reviewer` (when copy, images, products or tracking changed) → `urdu-rtl-reviewer` → `qa-auditor`. Fix every BLOCKER and MAJOR, then re-run what the fix affects.
8. `npm run qa:review -- --title "<STAGE>"` and publish `qa/review.html` as an artifact (private). Keep its link for the report.
9. Commit `chore(qa): screenshots + lighthouse <stage>` and push the branch.
10. Post the approval gate report in the exact format from `CLAUDE.md`, then stop. Do not start the next stage until Ahmad writes "approved".
