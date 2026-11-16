#!/usr/bin/env bash
# SessionStart hook (cloud sessions only): installs npm packages when needed and reports missing tools or variables.
# Whatever this prints is added to Claude's context. It never prints secret values.
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

if [ -f package.json ]; then
  if [ -f package-lock.json ]; then
    stamp="node_modules/.zds-lock.sha256"
    hash="$(sha256sum package-lock.json | cut -d' ' -f1)"
    if [ ! -f "$stamp" ] || [ "$(cat "$stamp" 2>/dev/null)" != "$hash" ]; then
      if npm ci --no-audit --no-fund --loglevel=error > /tmp/zds-npm.log 2>&1; then echo "$hash" > "$stamp"
      else echo "ZDS: npm ci failed (see /tmp/zds-npm.log)."; fi
    fi
  elif [ ! -d node_modules ]; then
    npm install --no-audit --no-fund --loglevel=error > /tmp/zds-npm.log 2>&1 \
      || echo "ZDS: npm install failed (see /tmp/zds-npm.log)."
  fi
fi

node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>22||(a===22&&b>=19)?0:1)' \
  || echo "ZDS: Node $(node -v) is older than 22.19 (Lighthouse 13 needs 22.19+, Shopify CLI 5 needs 22.12+). Tell Ahmad."
command -v shopify > /dev/null 2>&1 || echo "ZDS: Shopify CLI not found. Check the environment setup script (docs/tech/cloud-setup.md)."
if [ -z "${CHROME_PATH:-}" ] || [ ! -x "${CHROME_PATH}" ]; then
  echo "ZDS: Chrome not found at CHROME_PATH. Screenshots and Lighthouse need it (docs/tech/cloud-setup.md)."
fi
for v in SHOPIFY_FLAG_STORE SHOPIFY_CLI_THEME_TOKEN STORE_PASSWORD REVIEW_THEME; do
  [ -n "${!v:-}" ] || echo "ZDS: environment variable $v is not set (docs/tech/cloud-setup.md)."
done
exit 0
