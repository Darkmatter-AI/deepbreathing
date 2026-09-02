#!/usr/bin/env bash
# Cursor Cloud Agent install phase for deepbreathingexercises.com (Next.js 15, pnpm 10, better-auth on Postgres).
# Idempotent: Node 22 + pnpm, Postgres 16 service, workspace deps, Playwright Chromium, local .env.local.
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"
log() { printf '\n=== %s ===\n' "$*"; }

log "System packages (Postgres 16)"
sudo apt-get update -qq
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq postgresql postgresql-contrib curl ca-certificates

log "Node 22.22+ (tests use node:module registerHooks; CI pins 22.22.2)"
node_ok() { node -v 2>/dev/null | awk -F'[v.]' '{exit !($2==22 && $3>=22 || $2>22)}'; }
if ! node_ok; then
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # The Cloud VM ships node via nvm; installing there keeps PATH consistent for later shells.
    . "$HOME/.nvm/nvm.sh"; nvm install 22 >/dev/null; nvm alias default 22 >/dev/null; nvm use 22 >/dev/null
  else
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y -qq nodejs
  fi
fi
node -v; node_ok
# Agent shells are non-login and use the base-image node; expose the nvm node 22 bin dir everywhere.
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  . "$HOME/.nvm/nvm.sh"; NODE_BIN="$(dirname "$(nvm which 22)")"
  for rc in "$HOME/.bashrc" "$HOME/.profile" "$HOME/.zshrc"; do
    grep -q 'cursor-node22' "$rc" 2>/dev/null || printf '\nexport PATH="%s:$PATH" # cursor-node22\n' "$NODE_BIN" >> "$rc"
  done
  sudo ln -sf "$NODE_BIN/node" /usr/local/bin/node; sudo ln -sf "$NODE_BIN/npm" /usr/local/bin/npm; sudo ln -sf "$NODE_BIN/npx" /usr/local/bin/npx
fi
log "pnpm (corepack, version from package.json packageManager)"
sudo corepack enable || true
corepack prepare --activate
pnpm -v

log "pnpm install (web app + workspace packages; Expo apps are dev-only deps)"
pnpm install --frozen-lockfile

log "Playwright Chromium (used by .cursor/skills/verify-deepbreathing and scripts/tests)"
pnpm dlx playwright@1.62.1 install --with-deps chromium || echo "playwright install skipped"

log "Local .env.local"
if [ ! -f .env.local ]; then
  cat > .env.local <<ENV
# Cursor Cloud local dev (gitignored). Real keys come from injected Cloud Agent secrets.
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/deepbreathing
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET:-$(openssl rand -base64 32)}
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_HOLIDAY_BANNER=true
NEXT_PUBLIC_GEMINI_API_KEY=${NEXT_PUBLIC_GEMINI_API_KEY:-}
RESEND_API_KEY=${RESEND_API_KEY:-}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-}
ENV
  echo "wrote .env.local"
else
  echo ".env.local exists; leaving as-is."
fi
log "install complete"
