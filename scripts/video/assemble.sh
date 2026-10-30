#!/usr/bin/env bash
# Join finished parts into one MP4 (re-encoded so every join is clean). Silent.
#   scripts/video/assemble.sh final.mp4 part1_intro.mp4 middle.mp4 part3_docs.mp4
set -euo pipefail
OUT="${1:?usage: assemble.sh out.mp4 part1.mp4 part2.mp4 ...}"; shift
[ "$#" -ge 1 ] || { echo "give at least one part"; exit 1; }
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
: > "$WORK/list.txt"
for f in "$@"; do
  [ -f "$f" ] || { echo "no such file: $f"; exit 1; }
  echo "file '$(cd "$(dirname "$f")" && pwd)/$(basename "$f")'" >> "$WORK/list.txt"
done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$WORK/list.txt" \
  -vf "fps=30,format=yuv420p" -c:v libx264 -preset medium -crf 18 -an -movflags +faststart "$OUT"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
echo "wrote $OUT ($(printf '%.0f' "$D") s)"
