"""Builds the soundtrack: voice-over + synthesized sound effects + a generative
ambient music bed, ducked under the voice. Everything is synthesized here, so
there are no third-party audio assets to license."""
import json
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly, fftconvolve

SR = 48000
rng = np.random.default_rng(7)
TIM = json.load(open("timings.json"))
EV = json.load(open("events.json"))
N = int((TIM["total"] + 0.5) * SR)


def T(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, o=2):
    return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)


def hp(x, f, o=2):
    return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)


def env_ad(n, a, d):
    """attack a seconds, exponential decay time-constant d"""
    t = np.arange(n) / SR
    e = np.exp(-np.maximum(t - a, 0) / d)
    return e * np.clip(t / max(a, 1e-4), 0, 1)


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


def place(bus, x, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= bus.shape[0]:
        return
    x = x[: bus.shape[0] - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    if x.ndim == 1:
        bus[i : i + len(x), 0] += x * gain * l * 1.41
        bus[i : i + len(x), 1] += x * gain * r * 1.41
    else:
        bus[i : i + len(x)] += x * gain


# ------------------------------------------------------------------ sfx
def sfx_whoosh(short=False):
    d = 0.55 if short else 0.9
    n = int(d * SR)
    x = rng.standard_normal(n)
    t = np.arange(n) / n
    # sweep a band through the noise in 8 blocks
    out = np.zeros(n)
    blocks = 16
    for b in range(blocks):
        s, e = b * n // blocks, (b + 1) * n // blocks
        f = 300 * (12 ** (b / blocks))
        seg = bp(x, f * 0.6, min(f * 1.8, 20000))[s:e]
        out[s:e] = seg
    shape = np.sin(np.pi * t) ** 1.6
    return out * shape * 0.5


def sfx_pop(pitch=1.0):
    t = T(0.12)
    f = 700 * pitch * np.exp(-t * 30) + 260 * pitch
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 32) * 0.55


def sfx_tick(pitch=1.0):
    t = T(0.06)
    x = np.sin(2 * np.pi * 2100 * pitch * t) * np.exp(-t * 90)
    x += 0.4 * hp(rng.standard_normal(len(t)), 4000) * np.exp(-t * 300)
    return x * 0.35


def sfx_type():
    t = T(0.05)
    return hp(rng.standard_normal(len(t)), 1500) * np.exp(-t * 140) * 0.3


def sfx_click():
    t = T(0.09)
    x = np.sin(2 * np.pi * 1600 * t) * np.exp(-t * 120)
    x += 0.6 * bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t * 200)
    return x * 0.45


def sfx_ratchet():
    out = np.zeros(int(0.5 * SR))
    for k in range(6):
        c = sfx_click() * (0.6 + 0.08 * k)
        i = int(k * 0.065 * SR)
        out[i : i + len(c)] += c[: len(out) - i]
    return out * 0.7


def bell(f, d=1.4):
    t = T(d)
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * (2.4 + r)) for r, a in [(1, 1), (2.0, 0.5), (3.01, 0.25), (4.2, 0.12)])
    return x * np.clip(t / 0.004, 0, 1)


def sfx_ding():
    return bell(1318.5) * 0.35


def sfx_coin():
    a, b = bell(987.8, 0.5), bell(1318.5, 1.0)
    out = np.zeros(len(b) + int(0.08 * SR))
    out[: len(a)] += a * 0.8
    out[int(0.08 * SR) :] += b
    return out * 0.3


def sfx_shimmer(short=False):
    notes = [81, 85, 88, 93, 97, 100] if not short else [88, 93, 97]
    out = np.zeros(int(1.6 * SR))
    for k, m in enumerate(notes):
        x = bell(mtof(m), 1.0) * (0.8 - 0.08 * k)
        i = int(k * 0.045 * SR)
        out[i : i + len(x)] += x[: len(out) - i]
    return out * 0.16


def sfx_boom():
    t = T(1.6)
    f = 38 + 60 * np.exp(-t * 9)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    x += 0.35 * lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 14)
    return x * 0.8


def sfx_pulse(pitch=1.0):
    t = T(0.3)
    f = 90 * pitch + 60 * np.exp(-t * 40)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16)
    x += 0.25 * np.sin(2 * np.pi * 660 * pitch * t) * np.exp(-t * 30)
    return x * 0.6


def sfx_scan():
    t = T(1.0)
    f = 500 + 1400 * t
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 24 * t))
    return x * np.sin(np.pi * t) * 0.14


def sfx_riser(dur=1.2):
    n = int(dur * SR)
    t = np.arange(n) / n
    x = rng.standard_normal(n)
    out = np.zeros(n)
    for b in range(12):
        s, e = b * n // 12, (b + 1) * n // 12
        out[s:e] = bp(x, 400 * 2 ** (b / 3), min(900 * 2 ** (b / 3), 20000))[s:e]
    return out * t ** 2 * 0.25


def sfx_chord():
    out = np.zeros(int(4.5 * SR))
    for k, m in enumerate([57, 64, 69, 72, 76, 83]):
        x = bell(mtof(m), 4.0) * 0.5
        i = int(k * 0.03 * SR)
        out[i : i + len(x)] += x[: len(out) - i]
    return lp(out, 5000) * 0.35


def make(e):
    n = e["name"]
    if n == "whoosh": return sfx_whoosh(e.get("short"))
    if n == "pop": return sfx_pop(e.get("pitch", 1))
    if n == "tick": return sfx_tick(e.get("pitch", 1))
    if n == "type": return sfx_type()
    if n == "click": return sfx_click()
    if n == "ratchet": return sfx_ratchet()
    if n == "ding": return sfx_ding()
    if n == "coin": return sfx_coin()
    if n == "shimmer": return sfx_shimmer(e.get("short"))
    if n == "boom": return sfx_boom()
    if n == "pulse": return sfx_pulse(e.get("pitch", 1))
    if n == "scan": return sfx_scan()
    if n == "riser": return sfx_riser(e.get("dur", 1.2))
    if n == "chord": return sfx_chord()
    raise ValueError(n)


sfx = np.zeros((N, 2))
for e in EV:
    x = make(e)
    t0 = e["t"] - (e.get("dur", 1.2) if e["name"] == "riser" else 0)
    place(sfx, x, t0, e["gain"], e.get("pan", 0))

# ------------------------------------------------------------------ voice
voice = np.zeros((N, 2))
for cid, c in TIM["cues"].items():
    a, sr = sf.read(f"vo/{cid}.wav")
    a = resample_poly(a, SR, sr)
    a = hp(a, 70)
    rms = np.sqrt(np.mean(a[np.abs(a) > 0.02] ** 2))
    a = a * (0.16 / rms)
    a = np.tanh(a / 0.45) * 0.45  # soft-limit the sharp TTS peaks
    place(voice, a, c["start"], 1.0, 0)
# voice envelope for ducking
venv = lp(np.abs(voice[:, 0]), 6, 1)
venv = np.clip(venv / (venv.max() + 1e-9) * 3.0, 0, 1)
venv = lp(venv, 2, 1)

# ------------------------------------------------------------------ music
BPM = 88
beat = 60 / BPM
bar = 4 * beat
prog = [  # Am9, Fmaj7, Cmaj7(add9), G6 — gentle, hopeful loop
    [45, 57, 60, 64, 67, 71],
    [41, 57, 60, 64, 65, 69],
    [48, 55, 59, 62, 64, 67],
    [43, 55, 59, 62, 64, 71],
]
music = np.zeros((N, 2))
chord_len = 2 * bar
n_chords = int(np.ceil(TIM["total"] / chord_len)) + 1
ch11 = [s for s in TIM["scenes"] if s.get("chapter") == "1.1"][0]["start"]
ch12 = [s for s in TIM["scenes"] if s.get("chapter") == "1.2"][0]["start"]
ch13 = [s for s in TIM["scenes"] if s.get("chapter") == "1.3"][0]["start"]
outro = [s for s in TIM["scenes"] if s["id"] == "outro"][0]["start"]
end = TIM["total"]


def saw(f, t, det):
    ph = (f * det * t) % 1.0
    return 2 * ph - 1


for ci in range(n_chords):
    t0 = ci * chord_len
    if t0 > end:
        break
    notes = prog[ci % 4]
    d = chord_len + 1.8
    t = T(d)
    pad = np.zeros((len(t), 2))
    for m in notes[1:]:
        f = mtof(m)
        for s, det in enumerate([0.996, 1.0, 1.004]):
            x = saw(f, t + rng.random(), det)
            pan = [-0.7, 0, 0.7][s]
            pad[:, 0] += x * np.cos((pan + 1) * np.pi / 4)
            pad[:, 1] += x * np.sin((pan + 1) * np.pi / 4)
    e = np.clip(t / 1.4, 0, 1) * np.clip((d - t) / 1.8, 0, 1)
    pad = np.stack([lp(pad[:, 0], 900), lp(pad[:, 1], 900)], 1) * e[:, None] * 0.018
    # sub bass
    sub = np.sin(2 * np.pi * mtof(notes[0]) * t) * e * 0.10
    pad += sub[:, None]
    place(music, pad, t0)
    # arpeggio plucks, eighth notes, from chapter 1.1 on
    arp = [notes[1] + 12, notes[3] + 12, notes[4] + 12, notes[2] + 12, notes[5] + 12, notes[3] + 12, notes[4] + 12, notes[2] + 24]
    for k in range(16):
        tt = t0 + k * beat / 2
        if tt < ch11 - 0.5 or tt > outro + 6:
            continue
        m = arp[k % 8]
        tp = T(0.6)
        x = (np.sin(2 * np.pi * mtof(m) * tp) + 0.3 * np.sin(4 * np.pi * mtof(m) * tp)) * np.exp(-tp * 7) * np.clip(tp / 0.003, 0, 1)
        g = 0.05 * (1.0 if k % 2 == 0 else 0.7)
        place(music, x, tt, g, -0.35 if k % 2 else 0.35)
    # soft kick + hats from 1.2 on
    for k in range(8):
        tt = t0 + k * beat
        if ch12 - 0.2 < tt < outro + 2:
            if k % 2 == 0:
                tk = T(0.35)
                f = 48 + 90 * np.exp(-tk * 35)
                place(music, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tk * 11), tt, 0.16)
            if ch13 - 0.2 < tt:
                th = T(0.05)
                place(music, hp(rng.standard_normal(len(th)), 7000) * np.exp(-th * 90), tt + beat / 2, 0.035, 0.3)

# music dynamics: swell on the title, full in the body, fade at the very end
mt = np.arange(N) / SR
mgain = np.interp(mt, [0, 2.5, 6, end - 6, end - 0.3, end + 1], [0.7, 1.15, 1.0, 1.0, 0.0, 0.0])
music *= mgain[:, None]
music *= (1 - 0.55 * venv)[:, None]

# ------------------------------------------------------------------ space + master
ir_t = T(1.8)
ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t * 3.2)[:, None]
ir[:, 0] = lp(ir[:, 0], 6000); ir[:, 1] = lp(ir[:, 1], 6000)
ir /= np.sqrt((ir ** 2).sum(0))
send = music * 0.5 + sfx * 0.35 + voice * 0.05
verb = np.stack([fftconvolve(send[:, 0], ir[:, 0])[:N], fftconvolve(send[:, 1], ir[:, 1])[:N]], 1) * 0.35

mix = voice * 1.0 + sfx * 0.42 + music * 0.65 + verb
peak = np.abs(mix).max()
mix = mix / peak * 0.95
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
sf.write("soundtrack.wav", mix.astype(np.float32), SR, subtype="FLOAT")
sf.write("music_only.wav", (music / (np.abs(music).max() + 1e-9) * 0.8).astype(np.float32), SR)
print("ok", mix.shape[0] / SR, "s  peak before norm", peak)

def db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
act = venv > 0.5
print("voice (active) %.1f dB" % db(voice[act, 0]))
print("music under voice %.1f dB, music in gaps %.1f dB" % (db(music[act, 0] * 0.65), db(music[~act, 0] * 0.65)))
print("sfx overall %.1f dB, sfx peak %.1f dB" % (db(sfx[:, 0] * 0.55), 20*np.log10(np.abs(sfx*0.55).max())))
print("voice peak %.1f dB" % (20*np.log10(np.abs(voice).max())))
