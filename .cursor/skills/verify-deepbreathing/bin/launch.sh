#!/usr/bin/env bash
set -euo pipefail

# Start the Next.js dev server for Deep Breathing Exercises in isolation.
# - Writes PID and logs under .cursor/skills/verify-deepbreathing/run/
# - Ready when GET / on localhost:$PORT returns HTTP 200 (<60s)
#
# Usage:
#   .cursor/skills/verify-deepbreathing/bin/launch.sh [PORT]
# Env (optional):
#   PORT                 Port to bind (default 4317)
#   NATIVE_I18N_MODE     Defaults to 'proxy'
#   BETTER_AUTH_URL      Defaults to http://localhost:$PORT

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

SKILL_DIR=".cursor/skills/verify-deepbreathing"
RUN_DIR="$SKILL_DIR/run"
LOG_FILE="$RUN_DIR/dev.log"
PID_FILE="$RUN_DIR/dev.pid"

PORT="${1:-${PORT:-4317}}"
export PORT
export NODE_ENV=development
export NATIVE_I18N_MODE="${NATIVE_I18N_MODE:-proxy}"
export BETTER_AUTH_URL="${BETTER_AUTH_URL:-http://localhost:$PORT}"

mkdir -p "$RUN_DIR"

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "Server already running with PID $(cat "$PID_FILE") on port $PORT"
  exit 0
fi

# Ensure dependencies exist (first run only)
if [[ ! -d node_modules ]]; then
  echo "Installing dependencies (first run)..."
  pnpm install
fi

echo "Starting Next dev server on http://localhost:$PORT ..."
(
  pnpm exec next dev -H 0.0.0.0 -p "$PORT" >>"$LOG_FILE" 2>&1
) &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

# Wait for readiness (HTTP 200 or 3xx from /)
ATTEMPTS=120
until curl -sSf "http://localhost:$PORT/" >/dev/null 2>&1; do
  sleep 0.5
  ATTEMPTS=$((ATTEMPTS - 1))
  if [[ $ATTEMPTS -le 0 ]]; then
    echo "Server failed to become ready within 60s. See $LOG_FILE"
    exit 1
  fi
done

echo "ready http://localhost:$PORT"
