"""Voice-over: one Kokoro TTS clip per cue (cached in vo/), laid out into timings.json.
Delete vo/<id>.wav after editing a cue's text so it is re-synthesised."""
import json, numpy as np, soundfile as sf, os
from kokoro_onnx import Kokoro
_k = None
def kokoro():
    global _k
    if _k is None:
        _k = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
    return _k
script = json.load(open("script.json"))
os.makedirs("vo", exist_ok=True)
SR = 24000
GAP_CUE, GAP_SCENE, LEAD = 0.45, 1.0, 1.2
t = LEAD
out = {"scenes": [], "cues": {}}
for sc in script:
    s0 = t - (LEAD if not out["scenes"] else 0.5)
    for c in sc["cues"]:
        fn = f"vo/{c['id']}.wav"
        if os.path.exists(fn):
            a, sr = sf.read(fn)
        else:
            a, sr = kokoro().create(c["text"], voice="af_heart", speed=1.0, lang="en-us")
            # trim leading/trailing near-silence
            idx = np.where(np.abs(a) > 0.01)[0]
            a = a[max(idx[0]-240,0): idx[-1]+2400]
            sf.write(fn, a, sr)
        d = len(a)/sr
        out["cues"][c["id"]] = {"start": round(t,3), "dur": round(d,3), "text": c["text"], "scene": sc["scene"]}
        t += d + GAP_CUE + c.get("hold", 0)
    t += GAP_SCENE - GAP_CUE
    out["scenes"].append({"id": sc["scene"], "chapter": sc.get("chapter"), "start": round(max(s0,0),3), "end": round(t-0.5,3)})
out["total"] = round(t + 2.0, 3)
out["scenes"][-1]["end"] = out["total"]
json.dump(out, open("timings.json","w"), indent=1)
print(out["total"]); [print(s) for s in out["scenes"]]
