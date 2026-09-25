# The film — "The anatomy of an LLM, in under three minutes"

Source for the narrated animation in chapter **1.0**. The web app only ships the rendered
outputs in `src/assets/film/`. This folder is how they are made.

| File | Role |
|---|---|
| `script.json` | The voice-over, cue by cue, grouped into scenes. `hold` adds a pause after a cue. |
| `tts.py` | Synthesises each cue with the Kokoro neural TTS model (voice `af_heart`) and lays the cues out into `timings.json`. |
| `film.html` + `film.js` | The animation: a deterministic canvas renderer, `render(t)`. All motion is keyed to cue times, and every sound effect is registered from the same key times. |
| `events.js` | Exports the sound-effect cue list (`events.json`) from the animation. |
| `mix.py` | Synthesises the sound effects and a generative ambient music bed, ducks the music under the voice, and writes `soundtrack.wav`. All audio is generated, so no third-party assets need licensing. |
| `render.js` | Renders frames in headless Chromium and pipes them to ffmpeg (run several workers in parallel). |
| `gen_meta.py` | Writes the WebVTT captions and `filmMeta.js` (chapter times and transcript) for the page. |
| `build.sh` | Runs everything end to end. |

## Rebuild

Requires Python 3.11+ (`pip install kokoro-onnx soundfile scipy`), Node 18+, ffmpeg and a
Chromium that Playwright can launch.

```bash
cd film
./build.sh            # ~10 min on 4 cores; WORKERS=n to change parallelism
```

To change the words, edit `script.json`, delete the matching `vo/<id>.wav`, and rebuild.
Timings flow through automatically. If you rename a phrase that `film.js` keys an animation to
(the `wt(cue, "phrase")` calls), the renderer throws and names the missing phrase.

Preview a single frame: open `film.html?t=42` in a browser after one `build.sh` run (it needs
`timings.js` and `node_modules`), or run `node still.js 42` to write `stills/s_000042.png`.
