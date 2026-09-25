#!/usr/bin/env bash
# Rebuilds src/assets/film/* from script.json. See README.md in this folder.
set -euo pipefail
cd "$(dirname "$0")"
OUT=../src/assets/film
WORKERS=${WORKERS:-3}
[ -f kokoro-v1.0.onnx ] || curl -sSL -o kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
[ -f voices-v1.0.bin ]  || curl -sSL -o voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
[ -d node_modules ] || npm install --no-audit --no-fund

python3 tts.py                                   # voice-over clips + timings.json
python3 -c "import json;open('timings.js','w').write('window.TIM='+json.dumps(json.load(open('timings.json')))+';')"
node events.js                                   # sound-effect cue list from the animation
python3 mix.py                                   # soundtrack.wav
rm -f seg_*.mp4
for w in $(seq 0 $((WORKERS - 1))); do node render.js "$w" "$WORKERS" & done; wait
printf "file 'seg_%d.mp4'\n" $(seq 0 $((WORKERS - 1))) > segs.txt
ffmpeg -loglevel error -y -f concat -safe 0 -i segs.txt -i soundtrack.wav \
  -map 0:v -map 1:a -c:v libx264 -preset slow -crf 24 -tune animation -pix_fmt yuv420p -movflags +faststart \
  -af "loudnorm=I=-16:TP=-1.5:LRA=11" -c:a aac -b:a 160k -ar 48000 -shortest "$OUT/llm-anatomy.mp4"
node still.js 4.5 && ffmpeg -loglevel error -y -i stills/s_0004.5.png -vf scale=1280:720 -q:v 3 "$OUT/llm-anatomy-poster.jpg"
python3 gen_meta.py "$OUT"                       # captions + chapter/transcript module
ls -la "$OUT"
