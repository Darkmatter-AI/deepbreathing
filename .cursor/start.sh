#!/usr/bin/env bash
# Cursor Cloud Agent start phase for deepbreathing: Postgres up, db exists, better-auth + custom tables applied.
set -euo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"
DB_URL="postgres://postgres:postgres@127.0.0.1:5432/deepbreathing"
[ -s "$HOME/.nvm/nvm.sh" ] && { . "$HOME/.nvm/nvm.sh"; nvm use 22 >/dev/null 2>&1 || true; }
log() { printf '\n=== %s ===\n' "$*"; }

log "Start PostgreSQL"
sudo pg_ctlcluster 16 main start 2>/dev/null || sudo service postgresql start || true
for _ in $(seq 1 30); do sudo -u postgres pg_isready -q && break; sleep 1; done
sudo -u postgres pg_isready
sudo -u postgres psql -qc "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='deepbreathing'" | grep -q 1 \
  || sudo -u postgres psql -qc "CREATE DATABASE deepbreathing;"

log "better-auth schema (user/account/session/verification)"
set -a; . ./.env.local; set +a
pnpm dlx @better-auth/cli@latest migrate --yes --config src/lib/auth.ts || echo "better-auth migrate skipped (see output); auth pages may 500 until run"

log "Custom app tables (src/lib/db/migrations, idempotent SQL)"
for f in src/lib/db/migrations/*.sql; do
  psql "$DB_URL" -v ON_ERROR_STOP=0 -q -f "$f" >/dev/null 2>&1 || echo "note: $f reported errors (usually already applied)"
done
log "start complete. Tests: pnpm test (node --test). Post-build SSR checks: pnpm build"
