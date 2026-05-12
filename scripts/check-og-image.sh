#!/usr/bin/env bash
# Smoke-test the /og and /og/[slug] PNG endpoints.
# Each route must return HTTP 200, content-type: image/png, and a body
# bigger than MIN_BYTES (default 10 KB — anything below that is almost
# certainly a satori or font-load failure returning empty/error bytes).
#
# Usage:
#   ./scripts/check-og-image.sh                       # tests prod origin
#   BASE=https://my-preview.vercel.app ./scripts/check-og-image.sh
#   ./scripts/check-og-image.sh https://example.com   # positional override
#
# Exit code: 0 if all checks pass, 1 if any fail.

set -u

BASE="${1:-${BASE:-https://origin.deepbreathingexercises.com}}"
MIN_BYTES="${MIN_BYTES:-10000}"

# Cache-bust each request so we test the actual route, not Vercel CDN.
CB="cb=ogcheck-$(date +%s)"

URLS=(
  "${BASE}/og/box?${CB}"
  "${BASE}/og/4-7-8?${CB}"
  "${BASE}/og/coherent?${CB}"
  "${BASE}/og?title=Box+Breathing&color=ef4444&${CB}"
)

# ANSI colors; disable when not a TTY (so CI logs stay clean).
if [ -t 1 ]; then
  GREEN=$'\033[32m'; RED=$'\033[31m'; DIM=$'\033[2m'; OFF=$'\033[0m'
else
  GREEN=""; RED=""; DIM=""; OFF=""
fi

fails=0
echo "Checking OG image endpoints at ${BASE}"
echo "Minimum body size: ${MIN_BYTES} bytes"
echo

for url in "${URLS[@]}"; do
  tmp=$(mktemp -t og-check.XXXXXX)
  metrics=$(curl -sS -o "$tmp" -w '%{http_code} %{size_download} %{content_type}' "$url" || true)
  read -r status size ctype <<< "$metrics"

  ok=1
  reasons=()
  if [ "$status" != "200" ]; then ok=0; reasons+=("status=$status"); fi
  if [ "${ctype%%;*}" != "image/png" ]; then ok=0; reasons+=("content-type=$ctype"); fi
  if [ "${size:-0}" -lt "$MIN_BYTES" ]; then ok=0; reasons+=("size=$size < $MIN_BYTES"); fi

  # Sanity check: first 8 bytes should be the PNG signature.
  if [ "$ok" = "1" ] && ! head -c 8 "$tmp" | xxd -p | grep -qi '^89504e470d0a1a0a'; then
    ok=0
    reasons+=("body is not a PNG (header mismatch)")
  fi

  if [ "$ok" = "1" ]; then
    echo "  ${GREEN}OK${OFF}    ${url}  ${DIM}(${size} bytes)${OFF}"
  else
    echo "  ${RED}FAIL${OFF}  ${url}  ${RED}${reasons[*]}${OFF}"
    fails=$((fails + 1))
  fi

  rm -f "$tmp"
done

echo
if [ "$fails" -gt 0 ]; then
  echo "${RED}${fails} OG endpoint(s) failed.${OFF}"
  echo "Likely causes: missing fonts (loadInterFonts), satori CSS rejections (display:flex,"
  echo "explicit width/height on absolute children), or @vercel/og version regression."
  echo "Check Vercel runtime logs filtered by level=error for the exact satori message."
  exit 1
fi
echo "${GREEN}All OG endpoints healthy.${OFF}"
