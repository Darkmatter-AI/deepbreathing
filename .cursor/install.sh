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

log "Node 22"
if ! node -v 2>/dev/null | grep -qE '^v2[2-9]'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi
node -v
log "pnpm (corepack, version from package.json packageManager)"
sudo corepack enable || true
corepack prepare --activate
pnpm -v

log "pnpm install (web app + workspace packages; Expo apps are dev-only deps)"
pnpm install --frozen-lockfile

log "Playwright Chromium (used by .cursor/skills/verify-deepbreathing and scripts/tests)"
pnpm exec playwright install --with-deps chromium || echo "playwright install skipped"

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
