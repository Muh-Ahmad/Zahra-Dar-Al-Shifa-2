# Zahra Dar Al-Shifa — clinic website (Shopify theme)

Bilingual Shopify theme (Urdu RTL default + English) for زہرا دار الشفاء, Canal Gardens, Lahore.
Built by Claude Code (cloud sessions) with Shopify CLI. Git `staging` → review/staging themes, `main` → live theme at launch.

| Start here | File |
|---|---|
| One-time setup (Ahmad) | `docs/tech/cloud-setup.md` |
| Rules Claude follows | `CLAUDE.md` |
| Facts (single source of truth) | `docs/brand/facts.yml` |
| All website words (Urdu + English) | `docs/content/copy.yml` |
| Session prompts (paste one per session) | `docs/prompts/` (start with `00-go-live.md` to launch the one-page site first) |

The Shopify theme folders (`assets/ blocks/ config/ layout/ locales/ snippets/ templates/`) are created in the SETUP session from the pinned Skeleton theme in `vendor/` and must stay at the **repo root**. Shopify's GitHub integration only reads a theme at the root and ignores every other folder here.

Never commit passwords or tokens. They live only in the Claude Code cloud environment.
