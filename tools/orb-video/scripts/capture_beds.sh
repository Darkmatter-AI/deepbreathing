#!/usr/bin/env bash
# Pass 2 — capture the 5 clean audio beds from the LOCAL hiss-fixed build
# (dbe-audio-v2 @ audio-v2-overnight on :3031), one per technique, then trim
# each to its exact integer-cycle master length with 5ms in/out fades so the
# loop seam has no boundary click. Idempotent: skips a capture whose webm
# already exists; always re-trims to public/<bed>.mp3.
#
# Usage: scripts/capture_beds.sh
set -euo pipefail
cd "$(dirname "$0")/.."   # tools/orb-video
BASE="${ORB_BASE:-http://localhost:3031}"
CAP="/tmp/orbcap"

# bed | route-slug | master-len-seconds
ROWS=(
  "box|box|48"
  "coherent|coherent|44"
  "relax|4-7-8|38"
  "sigh|physiological-sigh|44"
  "belly|belly|50"
)

for row in "${ROWS[@]}"; do
  IFS='|' read -r bed slug master <<< "$row"
  webm="$CAP/$bed/site_audio.webm"
  if [[ ! -f "$webm" ]]; then
    echo "=== capture $bed (/breathe/$slug, ${master}s + 4) ==="
    ORB_URL="$BASE/breathe/$slug?duration=120" ORB_D="$((master + 4))" ORB_OUT="$CAP/$bed" node scripts/capture_audio.js
  else
    echo "=== capture $bed: reuse existing webm ==="
  fi
  out="$((master))"
  fadeout=$(awk "BEGIN{printf \"%.3f\", $master-0.005}")
  echo "--- trim $bed -> public/$bed.mp3 (${master}s) ---"
  ffmpeg -y -loglevel error -i "$webm" -t "$master" \
    -af "afade=t=in:st=0:d=0.005,afade=t=out:st=$fadeout:d=0.005" \
    -ar 48000 -c:a libmp3lame -b:a 192k "public/$bed.mp3"
done

echo "=== beds ready ==="
ls -la public/*.mp3
