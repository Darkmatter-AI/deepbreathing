#!/usr/bin/env bash
set -euo pipefail

# Stop the dev server started by launch.sh. Never deletes evidence.
ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

SKILL_DIR=".cursor/skills/verify-deepbreathing"
RUN_DIR="$SKILL_DIR/run"
PID_FILE="$RUN_DIR/dev.pid"

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE" || true)"
  if [[ -n "${PID:-}" ]] && kill -0 "$PID" 2>/dev/null; then
    # Verify ownership: Next dev server
    if tr '\0' ' ' <"/proc/$PID/cmdline" 2>/dev/null | grep -Eiq 'next .*dev'; then
      kill "$PID" || true
      for _ in $(seq 1 40); do
        if kill -0 "$PID" 2>/dev/null; then sleep 0.25; else break; fi
      done
    fi
  fi
  rm -f "$PID_FILE"
fi

echo "cleanup: server stopped; run state cleared"
