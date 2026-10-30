#!/usr/bin/env bash
# Turn a raw screen recording into the finished demo: title card, burned-in captions,
# end card. Silent (no voice, no music). Needs ffmpeg.
#
#   scripts/video/build_video.sh path/to/raw.mov [out.mp4]
#
# Caption text and times: scripts/video/captions.txt
set -euo pipefail
cd "$(dirname "$0")"
CAPTIONS="${CAPTIONS:-captions.txt}"
# Seconds to cut from the start of the raw clip (captions times are RAW times and are shifted).
TRIM_START="${TRIM_START:-0}"

RAW="${1:?usage: build_video.sh raw-recording.mov [out.mp4]}"
OUT="${2:-bitcodex-demo.mp4}"
TITLE="BitcodeX"
SUB="Embedded wallets for Bittensor"
END1="Open source. Testnet and local chains."
END2="bitcodex-demo.vercel.app"
# TITLE_SECS=0 / END_SECS=0 leave the card out (for a middle segment).
TITLE_SECS="${TITLE_SECS:-3}"
END_SECS="${END_SECS:-4}"
# Optional: stop the raw clip at this RAW second.
TRIM_END="${TRIM_END:-}"
W=1920
H=1080
FONT=/System/Library/Fonts/Helvetica.ttc

command -v ffmpeg >/dev/null || { echo "ffmpeg is required (brew install ffmpeg)"; exit 1; }
[ -f "$RAW" ] || { echo "no such file: $RAW"; exit 1; }
[ -f "$FONT" ] || { echo "font not found: $FONT"; exit 1; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# 1. captions.txt -> captions.ass. Burned into the clip before the title card is added, so
#    the only shift is the trimmed start.
python3 - "$(echo "0 - $TRIM_START" | bc -l)" "$WORK/captions.ass" "$CAPTIONS" <<'PY'
import re, sys
shift = float(sys.argv[1]); out = sys.argv[2]
def secs(t):
    m, s = t.split(":"); return int(m) * 60 + float(s)
def ts(x):
    h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
    return f"{h}:{m:02d}:{s:05.2f}"
head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Cap,Helvetica,46,&H00FFFFFF,&H00FFFFFF,&H00000000,&HB4000000,1,0,0,0,100,100,0,0,3,14,0,2,160,160,70,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
lines = []
for raw in open(sys.argv[3], encoding="utf-8"):
    raw = raw.strip()
    if not raw or raw.startswith("#"):
        continue
    m = re.match(r"(\d+:\d+(?:\.\d+)?)\s*-\s*(\d+:\d+(?:\.\d+)?)\s*\|\s*(.+)$", raw)
    if not m:
        sys.exit(f"bad caption line: {raw}")
    a, b, text = secs(m[1]) + shift, secs(m[2]) + shift, m[3].replace("\\", "")
    if b <= 0:
        continue  # ends before the trimmed start
    a = max(a, 0.0)
    lines.append(f"Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,0,,{{\\fad(220,220)}}{text}")
open(out, "w", encoding="utf-8").write(head + "\n".join(lines) + "\n")
print(f"{len(lines)} captions")
PY

card() { # name secs line1 line2 size1
  ffmpeg -y -loglevel error -f lavfi -i "color=c=0x09090b:s=${W}x${H}:r=30:d=$2" \
    -vf "drawtext=fontfile=$FONT:text='$3':fontcolor=white:fontsize=${5:-120}:x=(w-text_w)/2:y=(h-text_h)/2-50,\
drawtext=fontfile=$FONT:text='$4':fontcolor=0xa1a1aa:fontsize=44:x=(w-text_w)/2:y=(h/2)+60,\
fade=t=in:st=0:d=0.6,fade=t=out:st=$(echo "$2 - 0.6" | bc):d=0.6" \
    -c:v libx264 -pix_fmt yuv420p -an "$WORK/$1.mp4"
}
[ "$TITLE_SECS" != "0" ] && card title "$TITLE_SECS" "$TITLE" "$SUB"
[ "$END_SECS" != "0" ] && card end "$END_SECS" "$END1" "$END2" 68

# 2. the recording: scale to 1080p (letterboxed, never stretched), burn captions, drop audio.
DUR_ARGS=()
if [ -n "$TRIM_END" ]; then DUR_ARGS=(-t "$(echo "$TRIM_END - $TRIM_START" | bc -l)"); fi
ffmpeg -y -loglevel error -ss "$TRIM_START" -i "$RAW" ${DUR_ARGS[@]+"${DUR_ARGS[@]}"} \
  -vf "fps=30,scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x09090b,ass=$WORK/captions.ass" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -an "$WORK/main.mp4"

# 3. title + main + end.
{
  [ -f "$WORK/title.mp4" ] && echo "file '$WORK/title.mp4'"
  echo "file '$WORK/main.mp4'"
  [ -f "$WORK/end.mp4" ] && echo "file '$WORK/end.mp4'"
} > "$WORK/list.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$WORK/list.txt" -c copy -movflags +faststart "$OUT"

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
echo "wrote $OUT  ($(printf '%.0f' "$DUR") s)"
