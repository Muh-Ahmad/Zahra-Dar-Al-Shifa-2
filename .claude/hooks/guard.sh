#!/usr/bin/env bash
# PreToolUse guard for Bash. Exit 2 blocks the command and shows the reason to Claude.
# Blocks: anything that could change the live store, force pushes, pushes to main/staging,
#         gh pr create (it fails in cloud sessions anyway) and commands that would print secrets.
input="$(cat)"
cmd="$(printf '%s' "$input" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String((JSON.parse(s).tool_input||{}).command||""))}catch(e){process.stdout.write(s)}})' 2>/dev/null)"
[ -n "$cmd" ] || cmd="$input"

block() { echo "BLOCKED by .claude/hooks/guard.sh: $1" >&2; exit 2; }
has() { printf '%s\n' "$cmd" | grep -Eq -- "$1"; }

# Live store protection (Shopify CLI 5 flags: -a/--allow-live, -p/--publish, -l/--live)
has 'shopify[[:space:]]+theme[[:space:]]+(publish|delete)' && block "publishing or deleting themes is done by Ahmad in Shopify admin."
has '--allow-live|--publish([[:space:]=]|$)|SHOPIFY_FLAG_(ALLOW_LIVE|PUBLISH|LIVE)' && block "never target or publish the live theme. Use: npm run push:review"
has 'shopify[[:space:]]+theme[[:space:]]+push([[:space:]].*)?[[:space:]](--live([[:space:]=]|$)|-[A-Za-z]*[apl][A-Za-z]*([[:space:]]|$))' && block "theme push with -a/-p/-l touches the live theme. Use: npm run push:review"
has 'shopify[[:space:]]+theme[[:space:]]+dev([[:space:]].*)?[[:space:]]-[A-Za-z]*a[A-Za-z]*([[:space:]]|$)' && block "theme dev must not run on the live theme."

# npm scripts must not hide a live-store command
if has '(^|[;&|[:space:]])npm[[:space:]]+(run|run-script|exec)[[:space:]]' && [ -f "${CLAUDE_PROJECT_DIR:-.}/package.json" ]; then
  grep -Eq -- 'theme[[:space:]]+(publish|delete)|--allow-live|--publish|--live([^-a-z]|$)' "${CLAUDE_PROJECT_DIR:-.}/package.json" \
    && block "package.json contains a live-store command (publish, delete, --allow-live or --live). Remove it first."
fi

# Git safety
has 'git[[:space:]]+push([[:space:]].*)?[[:space:]](--force([[:space:]=]|-with-lease|$)|-[A-Za-z]*f[A-Za-z]*([[:space:]]|$))' && block "no force pushes."
has 'git[[:space:]]+push([[:space:]].*)?[[:space:]:+/](main|staging)([[:space:]]|$)' && block "never push to main or staging. Push your claude/* branch; Ahmad merges the PR."
if has '(^|[;&|[:space:]])git[[:space:]]+push([[:space:]]|$)' && ! has 'claude/'; then
  current="$(git -C "${CLAUDE_PROJECT_DIR:-.}" rev-parse --abbrev-ref HEAD 2>/dev/null)"
  case "$current" in main|staging) block "you are on $current. Create a claude/<stage> branch before pushing." ;; esac
fi
has 'gh[[:space:]]+pr[[:space:]]+create' && block "gh pr create does not work in cloud sessions. Ask Ahmad to open the PR from the session's Changes card."

# Secrets must never reach the transcript
has '(^|[;&|][[:space:]]*)(printenv|env|set|export[[:space:]]+-p)[[:space:]]*($|[;&|])' && block "this would print environment variables, including secrets. Check one with: [ -n \"\$VAR\" ] && echo set"
has '(echo|printf)[^;&|]*\$\{?(SHOPIFY_CLI_THEME_TOKEN|STORE_PASSWORD)|printenv[^;&|]*(SHOPIFY_CLI_THEME_TOKEN|STORE_PASSWORD)' && block "never print SHOPIFY_CLI_THEME_TOKEN or STORE_PASSWORD."
has '(cat|less|more|head|tail)[[:space:]]+[^;&|]*\.env([[:space:]]|$)' && block "never print .env files."
exit 0
