#!/usr/bin/env bash
# Audio clipping diagnostic for the breathing-orb soundtrack.
#
# Captures objective evidence of the cue-tone clipping (and verifies a fix):
#   - spectrogram PNG (visual: clipping shows as broadband vertical streaks at cue onsets)
#   - per-channel waveform PNG (visual: flat-topped peaks = hard clipping)
#   - true-peak (dBTP) via ebur128  — > -1.0 dBTP means inter-sample clipping risk
#   - sample-level peak + flatness  via astats — Peak level 0.0 dB / high Flat factor = clipped
#
# Usage:
#   ./audio-spectrogram.sh <input-audio> [out-prefix]
#   # capture first with: node scripts/capture_audio.js   (taps the live WebAudio graph)
#
# A/B workflow: run on production audio (main, no limiter) vs an audio-v2
# preview deploy, and compare _spectrogram.png + the True peak numbers.
set -euo pipefail

IN="${1:?usage: audio-spectrogram.sh <input-audio> [out-prefix]}"
OUT="${2:-${IN%.*}}"

echo "input: $IN"
ffmpeg -y -loglevel error -i "$IN" -lavfi "showspectrumpic=s=1600x800:legend=1:mode=separate" "${OUT}_spectrogram.png"
ffmpeg -y -loglevel error -i "$IN" -lavfi "showwavespic=s=1600x400:split_channels=1" "${OUT}_waveform.png"
echo "wrote: ${OUT}_spectrogram.png  ${OUT}_waveform.png"

echo ""
echo "=== true peak / loudness (ebur128) ==="
ffmpeg -hide_banner -nostats -i "$IN" -af ebur128=peak=true -f null - 2>&1 \
  | grep -iE "Integrated loudness|True peak|Peak:" | tail -6

echo ""
echo "=== sample peak + clipping flatness (astats) ==="
ffmpeg -hide_banner -nostats -i "$IN" -af astats=metadata=1:measure_overall=Peak_level+Flat_factor+Peak_count -f null - 2>&1 \
  | grep -iE "Peak level dB|Flat factor|Peak count" | head -12

echo ""
echo "interpretation: True peak > -1.0 dBTP or Peak level dB == 0.0 with a high"
echo "Flat factor / large Peak count == hard clipping. A working limiter should"
echo "pin True peak at ~ the limiter ceiling (e.g. -3 dBTP) with Flat factor ~0."
