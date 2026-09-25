/* The anatomy of an LLM — a deterministic canvas film.
   render(t) draws the frame at time t (seconds). Every timing is derived from the
   voice-over cue times in timings.js, and every sound effect is registered in EV
   from the same key times, so picture and sound cannot drift apart. */

const TIM = window.TIM
const W = 1920, H = 1080
const cv = document.getElementById('c')
const ctx = cv.getContext('2d')

const C = {
  bg: '#0b0e17', soft: '#10141f', card: '#151a28', card2: '#1a2032', border: '#232b40', bright: '#33405e',
  text: '#e8ecf5', dim: '#9aa5bd', faint: '#67728c',
  cyan: '#38d1e0', violet: '#8b7cf7', pink: '#f472b6', green: '#4ade80', orange: '#fb923c', yellow: '#facc15',
}
const CHIP = [C.cyan, C.violet, C.pink, C.green, C.orange, C.yellow]
const MONO = 'JetBrains Mono'

/* ---------------------------------------------------------------- helpers */
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const lerp = (a, b, t) => a + (b - a) * t
const E = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) },
  expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
}
const P = (t, a, d) => clamp((t - a) / d)
const Po = (t, a, d) => E.out(P(t, a, d))
const Pb = (t, a, d) => E.back(P(t, a, d))
const cs = (id) => TIM.cues[id].start
const ce = (id) => TIM.cues[id].start + TIM.cues[id].dur
// time a word is spoken, estimated from its character position in the cue
function wt(id, word) {
  const c = TIM.cues[id]
  const i = c.text.toLowerCase().indexOf(word.toLowerCase())
  if (i < 0) throw new Error(`"${word}" not in cue ${id}`)
  return c.start + c.dur * (i / c.text.length)
}
const SC = {}
TIM.scenes.forEach((s) => (SC[s.id] = s))
function noise(a, b) { const v = Math.sin((a + 1) * 37.7 + (b + 1) * 91.3) * 43758.5453; return v - Math.floor(v) }
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})` }
const fmt = (n) => Math.round(n).toLocaleString('en-US')
// a flash that decays after time a
const flash = (t, a, k = 4) => (t < a ? 0 : Math.exp(-(t - a) * k))

function A(a, fn) { if (a <= 0.002) return; ctx.save(); ctx.globalAlpha *= a; fn(); ctx.restore() }
function at(x, y, s, fn) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); fn(); ctx.restore() }
function font(size, weight = 600, fam = 'Inter') { ctx.font = `${weight} ${size}px "${fam}"` }
function txt(s, x, y, o = {}) {
  const { size = 32, weight = 600, color = C.text, align = 'left', base = 'alphabetic', fam = 'Inter', ls = 0, glow = 0 } = o
  font(size, weight, fam)
  ctx.letterSpacing = ls + 'px'
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow }
  ctx.fillText(s, x, y)
  ctx.shadowBlur = 0; ctx.letterSpacing = '0px'
}
function tw(s, size, weight = 600, fam = 'Inter') { font(size, weight, fam); return ctx.measureText(s).width }
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r) }
function card(x, y, w, h, o = {}) {
  const { fill = C.card, stroke = C.border, r = 20, lw = 1.5, glow = null, glowA = 0.5 } = o
  rr(x, y, w, h, r)
  if (glow) { ctx.shadowColor = rgba(glow, glowA); ctx.shadowBlur = 40 }
  ctx.fillStyle = fill; ctx.fill(); ctx.shadowBlur = 0
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke() }
}
// centred token chip; returns its width
function chip(cx, cy, label, color, o = {}) {
  const { size = 44, fam = 'Inter', weight = 600, fillA = 0.2, strokeA = 0.75, glow = 0, padX = size * 0.42, textColor = C.text } = o
  const w = tw(label, size, weight, fam) + padX * 2, h = size * 1.55
  rr(cx - w / 2, cy - h / 2, w, h, size * 0.28)
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow }
  ctx.fillStyle = rgba(color, fillA); ctx.fill(); ctx.shadowBlur = 0
  ctx.strokeStyle = rgba(color, strokeA); ctx.lineWidth = 2; ctx.stroke()
  txt(label, cx, cy + size * 0.02, { size, weight, fam, align: 'center', base: 'middle', color: textColor })
  return w
}
const chipW = (label, size = 44, fam = 'Inter', weight = 600) => tw(label, size, weight, fam) + size * 0.84
function line(x1, y1, x2, y2, color, lw = 2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke() }
function dot(x, y, r, color, glow = 0) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow } ctx.fillStyle = color; ctx.fill(); ctx.shadowBlur = 0 }
function headline(t, s, t0, sub) {
  const a = Po(t, t0, 0.7)
  A(a, () => {
    txt(s, W / 2, 178 + (1 - a) * 24, { size: 58, weight: 800, align: 'center', ls: -1 })
    if (sub) txt(sub, W / 2, 226 + (1 - a) * 24, { size: 26, weight: 500, align: 'center', color: C.dim })
  })
}
// a quadratic curve drawn up to fraction f
function qcurve(x1, y1, cx, cy, x2, y2, f, color, lw) {
  ctx.beginPath(); ctx.moveTo(x1, y1)
  const n = 40
  for (let i = 1; i <= Math.round(n * f); i++) {
    const s = i / n
    ctx.lineTo((1 - s) * (1 - s) * x1 + 2 * (1 - s) * s * cx + s * s * x2, (1 - s) * (1 - s) * y1 + 2 * (1 - s) * s * cy + s * s * y2)
  }
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt'
}
const qpt = (x1, y1, cx, cy, x2, y2, s) => [(1 - s) * (1 - s) * x1 + 2 * (1 - s) * s * cx + s * s * x2, (1 - s) * (1 - s) * y1 + 2 * (1 - s) * s * cy + s * s * y2]

/* ---------------------------------------------------------------- sound events */
const EV = []
function ev(name, t, gain = 1, pan = 0, extra = {}) { EV.push({ name, t: Math.max(0, +t.toFixed(3)), gain, pan, ...extra }) }
const panX = (x) => clamp((x - W / 2) / (W / 2), -1, 1) * 0.6

/* ---------------------------------------------------------------- the plan: key times */
const K = {}
function plan() {
  // TITLE
  ev('whoosh', 0.15, 0.7); ev('boom', 0.55, 0.9)
  K.titleChips = [3.0, 3.3, 3.6]; K.titleChips.forEach((x, i) => ev('pop', x, 0.6, (i - 1) * 0.4))

  // CONTEXT
  K.ctxTypeStart = cs('c1') + 0.4
  for (let i = 0; i < 18; i += 2) ev('type', K.ctxTypeStart + i / 16, 0.35)
  K.ctxB = wt('c2', 'system prompt') - 0.35
  K.ctxBlocks = [wt('c2', 'system prompt') - 0.1, wt('c2', 'whole conversation') - 0.1, wt('c2', 'retrieved') - 0.1, wt('c2', 'tool outputs') - 0.1]
  K.ctxBlocks.forEach((x, i) => ev('whoosh', x - 0.15, 0.55, -0.4 + i * 0.2, { short: 1 }))
  K.ctxJoin = wt('c2', 'stitched'); ev('click', K.ctxJoin + 0.35, 0.7)
  K.ctxBill = wt('c2', 'billed') - 0.1; ev('coin', K.ctxBill + 0.2, 0.7)

  // TOKENIZE
  K.tokSplit = wt('k1', 'chops') - 0.1; ev('scan', K.tokSplit, 0.55)
  for (let i = 0; i < 5; i++) ev('pop', K.tokSplit + 0.15 * i + 0.15, 0.45, -0.5 + i * 0.25)
  K.tokIds = wt('k1', 'number') - 0.2
  for (let i = 0; i < 5; i++) ev('tick', K.tokIds + 0.22 * i + 0.55, 0.8, -0.5 + i * 0.25)
  K.tokCount = wt('k2', 'five tokens') - 0.1; ev('pop', K.tokCount, 0.7)
  K.tokRare = wt('k2', 'tokens are') - 0.3
  K.tokInvoice = wt('k2', 'invoice') - 0.35; ev('whoosh', K.tokInvoice - 0.1, 0.4, 0, { short: 1 }); ev('coin', K.tokInvoice + 0.5, 0.55)

  // EMBED
  K.embStart = cs('e1') + 0.2
  for (let j = 0; j < 12; j += 1) ev('tick', K.embStart + 0.25 + j * 0.07, 0.22, 0, { pitch: 1 + j * 0.06 })
  K.embGeo = wt('e1', 'meaning') - 0.2; ev('shimmer', K.embGeo, 0.6, 0.4)

  // LAYERS
  K.layIn = cs('l1')
  K.layRun0 = cs('l1') + 1.0; K.layRun1 = ce('l1') + 0.3
  K.slabX = Array.from({ length: 10 }, (_, i) => 380 + i * 128)
  K.slabPass = K.slabX.map((x) => lerp(K.layRun0, K.layRun1, (x - 150) / 1620))
  K.slabPass.forEach((x, i) => ev('pulse', x, 0.55, panX(K.slabX[i]), { pitch: 1 + i * 0.05 }))
  K.attIn = cs('l2') - 0.35; ev('whoosh', K.attIn - 0.1, 0.55)
  K.attArcs = [wt('l2', 'look back'), wt('l2', 'look back') + 0.3, wt('l2', 'look back') + 0.6, wt('l2', 'look back') + 0.9]
  K.attArcs.forEach((x, i) => ev('shimmer', x, 0.35 - i * 0.05, -0.3 + i * 0.1, { short: 1 }))
  K.attSat = wt('l2', '"sat"'); K.attCat = wt('l2', '"cat"')
  ev('pop', K.attSat, 0.6, -0.1); ev('pop', K.attCat, 0.6, -0.3)

  // PREDICT
  K.preBars = wt('p1', 'scores') - 0.2
  for (let i = 0; i < 6; i++) ev('pop', K.preBars + 0.12 * i, 0.35, 0.35, { pitch: 1.2 - i * 0.06 })
  K.preWin = wt('p1', 'wins') - 0.15
  K.prePick = wt('p1', 'picks') + 0.1
  K.roulette = []
  { const n = 9; for (let i = 0; i < n; i++) { const f = i / (n - 1); K.roulette.push({ t: lerp(K.preWin - 0.6, K.prePick, 1 - Math.pow(1 - f, 1.8)), idx: (n - 1 - i) % 5 }) } }
  K.roulette.forEach((r) => ev('tick', r.t, 0.45, 0.35))
  ev('ding', K.prePick, 0.7, 0.35)
  K.preFly = wt('p2', 'fed') - 0.1; ev('whoosh', K.preFly, 0.6, 0)
  K.preLand = K.preFly + 0.9
  K.preRun = wt('p2', 'runs again') - 0.1
  const s1 = wt('p2', 'one full pass')
  K.stream = [K.preLand, s1, s1 + 0.6, s1 + 1.2, s1 + 1.8]
  K.stream.forEach((x, i) => { ev('tick', x, 0.75, -0.2, { pitch: 1 + i * 0.08 }); if (i) ev('pulse', x - 0.12, 0.35) })

  // PREFILL vs DECODE
  K.pfIn = cs('f1')
  ev('whoosh', K.pfIn + 0.1, 0.5, -0.5, { short: 1 }); ev('whoosh', K.pfIn + 0.35, 0.5, 0.5, { short: 1 })
  K.pfFlash = wt('f2', 'one parallel pass') - 0.15; ev('boom', K.pfFlash, 0.55, -0.4); ev('whoosh', K.pfFlash - 0.25, 0.45, -0.4, { short: 1 })
  K.pfFast = wt('f2', 'fast')
  K.dcStart = wt('f3', 'one token at a time') - 0.1
  K.dcStep = (ce('f3') + 0.9 - K.dcStart) / 12
  for (let i = 0; i < 12; i++) ev('tick', K.dcStart + i * K.dcStep, 0.6, 0.45, { pitch: 1 + i * 0.03 })
  K.dcReread = wt('f3', 're-reads')
  K.price = cs('f4') - 0.1
  ev('pop', K.price + 0.2, 0.5); ev('riser', K.price + 0.5, 0.45, 0, { dur: 1.2 })
  K.disc1 = wt('f5', 'cached') - 0.15; K.disc2 = wt('f5', 'batch') - 0.15
  ev('coin', K.disc1 + 0.1, 0.6, -0.3); ev('coin', K.disc2 + 0.1, 0.6, 0.3)
  K.discDim = cs('f5') - 0.2

  // DIALS
  K.knobX = [260, 610, 960, 1310, 1660]
  K.knobIn = K.knobX.map((_, i) => cs('d0') + 0.25 + i * 0.18)
  K.knobIn.forEach((x, i) => ev('click', x, 0.7, panX(K.knobX[i])))
  K.own = [wt('d0', 'model maker'), wt('d0', 'whoever serves'), wt('d0', 'one is yours')]
  K.own.forEach((x) => ev('pop', x, 0.45))
  K.dial = [1, 2, 3, 4, 5].map((i) => cs('d' + i) - 0.15)
  K.dialEnd = [...K.dial.slice(1), ce('d5') + 0.8]
  K.dial.forEach((x, i) => ev('ratchet', x, 0.6, panX(K.knobX[i])))
  // d1 tokenizer
  K.d1Bars = K.dial[0] + 0.9
  for (let i = 0; i < 4; i++) ev('pop', K.d1Bars + 0.14 * i, 0.3)
  K.d1Hindi = wt('d1', 'hindi') - 0.2; ev('ding', K.d1Hindi + 0.2, 0.45)
  // d2 architecture
  K.d2MoE = wt('d2', 'trillion') - 0.2; K.d2Dense = wt('d2', 'dense') - 0.3; K.d2Cheap = wt('d2', 'cheaper') - 0.2
  ev('pop', K.d2MoE, 0.5, -0.3); ev('pop', K.d2Dense, 0.5, 0.3); ev('coin', K.d2Cheap + 0.1, 0.45, -0.3)
  // d3 precision
  K.d3 = [wt('d3', 'sixteen bits'), wt('d3', 'to eight'), wt('d3', 'to four')].map((x) => x - 0.15)
  K.d3.forEach((x, i) => ev('pop', x, 0.5, 0, { pitch: 1 + i * 0.25 }))
  // d4 batching
  K.d4Fill0 = K.dial[3] + 1.0; K.d4Fill1 = wt('d4', 'cutting') - 0.1
  for (let i = 0; i < 16; i++) ev('tick', lerp(K.d4Fill0, K.d4Fill1, i / 15), 0.25, -0.2, { pitch: 1 + i * 0.04 })
  K.d4Cut = wt('d4', 'cutting'); ev('coin', K.d4Cut + 0.4, 0.6, 0.4)
  K.d4Lever = wt('d4', 'biggest lever') - 0.2; ev('boom', K.d4Lever, 0.35)
  // d5 context
  K.d5Rows0 = K.dial[4] + 0.8; K.d5Rows1 = ce('d5') - 0.4
  for (let i = 0; i < 10; i++) ev('tick', lerp(K.d5Rows0, K.d5Rows1, i / 9), 0.3, -0.3, { pitch: 0.9 + i * 0.05 })
  K.d5Resent = wt('d5', 're-sent') - 0.2

  // OUTRO
  K.outCards = [wt('o1', 'sequential') - 0.1, wt('o1', 'memory') - 0.1, wt('o1', 'weight reads') - 0.1]
  K.outCards.forEach((x, i) => ev('boom', x, 0.4, (i - 1) * 0.5))
  K.outLine = wt('o1', 'that is') - 0.1
  K.outFinal = cs('o2') - 0.3; ev('whoosh', K.outFinal - 0.1, 0.5); ev('chord', K.outFinal + 0.3, 0.8)
  K.end = TIM.total
}

/* ---------------------------------------------------------------- background + hud */
function background(t) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H)
  const g1 = ctx.createRadialGradient(420 + 80 * Math.sin(t * 0.13), 180 + 40 * Math.cos(t * 0.1), 0, 420, 180, 1000)
  g1.addColorStop(0, 'rgba(139,124,247,0.17)'); g1.addColorStop(1, 'rgba(139,124,247,0)')
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H)
  const g2 = ctx.createRadialGradient(1520 + 70 * Math.cos(t * 0.11), 900, 0, 1520, 900, 900)
  g2.addColorStop(0, 'rgba(56,209,224,0.11)'); g2.addColorStop(1, 'rgba(56,209,224,0)')
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H)
  // drifting dot grid
  const s = 48, ox = (t * 7) % s, oy = (t * 3) % s
  ctx.fillStyle = 'rgba(154,165,189,0.07)'
  for (let x = -s + ox; x < W; x += s) for (let y = -s + oy; y < H; y += s) ctx.fillRect(x, y, 2, 2)
}
function vignette() {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05)
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
}
const CHAPTERS = [
  { num: '1.1', label: 'How an LLM works', color: C.cyan },
  { num: '1.2', label: 'Prefill vs decode', color: C.pink },
  { num: '1.3', label: 'Five hidden dials', color: C.green },
]
function chapterSpan(num) {
  const sc = TIM.scenes.filter((s) => s.chapter === num)
  return [sc[0].start, sc[sc.length - 1].end]
}
function hud(t) {
  const hA = P(t, 5.6, 0.8) * (1 - P(t, TIM.total - 3.2, 1))
  A(hA, () => {
    txt('LLM TOKENOMICS', W - 64, 70, { size: 20, weight: 700, color: C.faint, align: 'right', ls: 5 })
    // chapter pill
    CHAPTERS.forEach((ch) => {
      const [a, b] = chapterSpan(ch.num)
      const k = Po(t, a + 0.1, 0.6) * (1 - P(t, b - 0.5, 0.45))
      A(k, () => {
        const label = ch.label
        const w = 88 + tw(label, 24, 700)
        const x = 64 - (1 - k) * 30
        card(x, 40, w, 48, { fill: rgba(ch.color, 0.1), stroke: rgba(ch.color, 0.5), r: 24 })
        txt(ch.num, x + 22, 72, { size: 22, weight: 700, fam: MONO, color: ch.color })
        txt(label, x + 72, 73, { size: 24, weight: 700 })
      })
    })
    // progress bar with chapter segments
    const x0 = 64, x1 = W - 64, y = H - 34
    rr(x0, y, x1 - x0, 4, 2); ctx.fillStyle = 'rgba(154,165,189,0.14)'; ctx.fill()
    const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, C.cyan); g.addColorStop(1, C.violet)
    rr(x0, y, (x1 - x0) * clamp(t / TIM.total), 4, 2); ctx.fillStyle = g; ctx.fill()
    CHAPTERS.forEach((ch) => {
      const [a] = chapterSpan(ch.num)
      const x = x0 + (x1 - x0) * (a / TIM.total)
      const on = t >= a
      dot(x, y + 2, 5, on ? ch.color : C.bright)
      txt(ch.num + ' ' + ch.label, x + 12, y - 10, { size: 16, weight: 600, color: on ? C.dim : C.faint })
    })
  })
}

/* ---------------------------------------------------------------- scenes */
const TITLE_WORDS = ['The', ' cat', '791', 'mat', 'token', '0.50', 'GPU', '$3/M', 'attention', 'KV', 'decode', 'prefill', 'softmax', '8415', 'FP8', 'batch', '→', 'vector', 'layer 80', 'omics']
function sTitle(t) {
  // drifting token confetti converging on the title
  const conv = Po(t, 0, 5)
  for (let i = 0; i < 46; i++) {
    const r1 = noise(i, 1), r2 = noise(i, 2), r3 = noise(i, 3)
    const ang = r1 * Math.PI * 2 + t * 0.05 * (r3 - 0.5)
    const d = (560 + r2 * 520) * (1 - 0.28 * conv)
    const x = W / 2 + Math.cos(ang) * d * 1.25, y = H / 2 + Math.sin(ang) * d * 0.62
    const a = (0.16 + 0.22 * r3) * Po(t, r2 * 1.2, 1)
    A(a, () => chip(x, y, TITLE_WORDS[i % TITLE_WORDS.length], CHIP[i % 6], { size: 18 + r3 * 10, fam: MONO, weight: 400, fillA: 0.12, strokeA: 0.5 }))
  }
  const k = Po(t, 0.25, 0.7)
  A(k, () => txt('LLM TOKENOMICS  ·  PART 1', W / 2, 400 - (1 - k) * 20, { size: 24, weight: 700, color: C.cyan, align: 'center', ls: 8 }))
  // per-letter title reveal
  const s1 = 'The anatomy of an ', s2 = 'LLM'
  const size = 128
  const full = s1 + s2
  const wFull = tw(full, size, 800)
  const x0 = W / 2 - wFull / 2, y = 560
  font(size, 800); ctx.letterSpacing = '0px'
  const gx0 = x0 + tw(s1, size, 800)
  const grad = ctx.createLinearGradient(gx0, 0, gx0 + tw(s2, size, 800), 0)
  grad.addColorStop(0, C.cyan); grad.addColorStop(1, C.violet)
  for (let i = 0; i < full.length; i++) {
    const a = Po(t, 0.55 + i * 0.035, 0.55)
    const x = x0 + tw(full.slice(0, i), size, 800)
    A(a, () => {
      font(size, 800)
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
      const isL = i >= s1.length
      ctx.fillStyle = isL ? grad : C.text
      if (isL) { ctx.shadowColor = rgba(C.violet, 0.6); ctx.shadowBlur = 30 * a }
      ctx.fillText(full[i], x, y + (1 - a) * 50)
      ctx.shadowBlur = 0
    })
  }
  const sa = Po(t, 1.9, 0.7)
  A(sa, () => txt('What you are actually buying — in under three minutes', W / 2, 640 + (1 - sa) * 16, { size: 38, weight: 500, color: C.dim, align: 'center' }))
  // the three chapters
  const labels = CHAPTERS.map((c) => c.num + '  ' + c.label)
  const ws = labels.map((l) => chipW(l, 28))
  let x = W / 2 - (ws.reduce((a, b) => a + b, 0) + 40) / 2
  labels.forEach((l, i) => {
    const s = Pb(t, K.titleChips[i], 0.5)
    const cx = x + ws[i] / 2
    A(P(t, K.titleChips[i], 0.2), () => at(cx, 790, s, () => chip(0, 0, l, CHAPTERS[i].color, { size: 28, fillA: 0.12 })))
    x += ws[i] + 20
  })
}

function sContext(t) {
  headline(t, 'What the model actually sees', cs('c1') - 0.3)
  // Phase A: the chat window
  const chatA = Po(t, cs('c1') - 0.1, 0.6) * (1 - P(t, K.ctxB - 0.5, 0.5))
  A(chatA, () => {
    const s = 1 - 0.1 * P(t, K.ctxB - 0.5, 0.5)
    at(W / 2, 560, s, () => {
      card(-460, -190, 920, 380, { fill: C.soft, r: 26 })
      ;[C.pink, C.yellow, C.green].forEach((c, i) => dot(-420 + i * 26, -154, 7, rgba(c, 0.7)))
      txt('Chat', 0, -146, { size: 22, weight: 600, color: C.faint, align: 'center' })
      line(-460, -120, 460, -120, C.border, 1.5)
      // user message typing
      const msg = 'The cat sat on the'
      const n = clamp(Math.floor((t - K.ctxTypeStart) * 16), 0, msg.length)
      const shown = msg.slice(0, n)
      const bw = Math.max(tw(msg, 40, 600) + 60, 120)
      card(400 - bw, -80, bw, 76, { fill: rgba(C.green, 0.14), stroke: rgba(C.green, 0.55), r: 22 })
      txt(shown + (n < msg.length || Math.floor(t * 2.2) % 2 ? '▍' : ''), 400 - bw + 30, -30, { size: 40, weight: 600 })
      txt('You', 400, 30, { size: 20, weight: 600, color: C.faint, align: 'right' })
      // model is "thinking"
      const th = P(t, K.ctxTypeStart + 1.4, 0.3)
      A(th, () => {
        card(-400, 60, 150, 70, { fill: C.card2, r: 22 })
        for (let i = 0; i < 3; i++) dot(-360 + i * 34, 95, 8, rgba(C.dim, 0.35 + 0.65 * Math.max(0, Math.sin(t * 6 - i * 0.8))))
      })
    })
  })
  // Phase B: the whole context, stitched
  const segs = [
    { name: 'System prompt', tok: 1200, col: C.violet },
    { name: 'Conversation history', tok: 2400, col: C.cyan },
    { name: 'Retrieved documents', tok: 3000, col: C.orange },
    { name: 'Tool outputs', tok: 1500, col: C.yellow },
    { name: 'Your message', tok: 5, col: C.green },
  ]
  const x0 = 150, x1 = 1770, y = 470, h = 150
  const msgW = 230, rest = x1 - x0 - msgW
  const join = Po(t, K.ctxJoin, 0.6)
  const gap = 16 * (1 - join)
  let x = x0
  const pos = segs.map((s, i) => {
    const w = i === 4 ? msgW : (rest * s.tok) / 8100
    const p = { x, w }; x += w; return p
  })
  segs.forEach((s, i) => {
    const t0 = i === 4 ? K.ctxB - 0.4 : K.ctxBlocks[i]
    const a = Po(t, t0, 0.6)
    const off = i === 4 ? (1 - a) * 200 : -(1 - a) * 260
    const p = pos[i]
    A(P(t, t0, 0.3), () => {
      const bx = p.x + off + gap * (i - 2), bw = p.w - 4
      const bill = flash(t, K.ctxBill + 0.1, 1.2)
      card(bx, y, bw, h, { fill: rgba(s.col, 0.16 + 0.12 * bill), stroke: rgba(s.col, 0.8), r: 14, lw: 2, glow: bill > 0.05 ? C.pink : null, glowA: bill * 0.8 })
      const nm = s.name.split(' ')
      nm.forEach((wd, j) => txt(wd, bx + 18, y + 44 + j * 30, { size: 26, weight: 700, color: s.col }))
      txt(i === 4 ? '5 tokens' : '~' + fmt(s.tok) + ' tok', bx + 18, y + h - 20, { size: 20, weight: 400, fam: MONO, color: C.dim })
    })
  })
  // context window frame + label
  A(join, () => {
    rr(x0 - 12, y - 12, x1 - x0 + 24, h + 24, 20); ctx.strokeStyle = rgba(C.text, 0.35); ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.stroke(); ctx.setLineDash([])
    txt('ONE CONTEXT  ·  sent in full, every turn', x0, y - 32, { size: 22, weight: 700, color: C.dim, ls: 3 })
  })
  // billed
  const b = Po(t, K.ctxBill, 0.5)
  A(b, () => {
    const by = y + h + 44
    ctx.strokeStyle = C.pink; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(x0, by - 14); ctx.lineTo(x0, by); ctx.lineTo(x1, by); ctx.lineTo(x1, by - 14); ctx.stroke()
    const n = 8105 * E.out(P(t, K.ctxBill, 1.1))
    txt('≈ ' + fmt(n) + ' tokens billed', W / 2, by + 78, { size: 60, weight: 800, color: C.pink, align: 'center', glow: 24 })
    txt('— not the 5 you typed', W / 2, by + 128, { size: 30, weight: 500, color: C.dim, align: 'center' })
  })
}

const TOKS = [['The', 791], [' cat', 8415], [' sat', 7731], [' on', 389], [' the', 279]]
function sTokenize(t) {
  headline(t, 'Text becomes tokens', cs('k1') - 0.3, 'the unit your invoice is counted in')
  const size = 104, y = 470
  const full = TOKS.map((x) => x[0]).join('')
  const wFull = tw(full, size, 700)
  // continuous positions
  let acc = W / 2 - wFull / 2
  const cont = TOKS.map(([s]) => { const w = tw(s, size, 700); const p = { x: acc, w }; acc += w; return p })
  // chip positions
  const labels = TOKS.map(([s]) => s.trim())
  const cw = labels.map((l) => chipW(l, 84, 'Inter', 700))
  const gap = 34
  const total = cw.reduce((a, b) => a + b, 0) + gap * 4
  let cx = W / 2 - total / 2
  const chipC = cw.map((w) => { const c = cx + w / 2; cx += w + gap; return c })
  const a0 = Po(t, cs('k1') - 0.2, 0.6)
  A(a0, () => {
    TOKS.forEach(([s, id], i) => {
      const sp = Pb(t, K.tokSplit + 0.15 * i + 0.1, 0.55)
      const contC = cont[i].x + cont[i].w / 2
      const x = lerp(contC, chipC[i], clamp(sp, 0, 1.2))
      if (sp < 0.02) {
        txt(s, cont[i].x, y + 36, { size, weight: 700 })
      } else {
        A(clamp(sp * 1.5), () => chip(x, y, labels[i], CHIP[i], { size: 84 * lerp(1.1, 1, clamp(sp)), weight: 700, fillA: 0.2 * clamp(sp), strokeA: 0.8 * clamp(sp) }))
        A(1 - clamp(sp * 1.5), () => txt(s, cont[i].x, y + 36, { size, weight: 700 }))
      }
      // token ids — rolling digits that settle
      const ia = P(t, K.tokIds + i * 0.1, 0.3)
      A(ia, () => {
        const settle = K.tokIds + 0.22 * i + 0.55
        const str = String(id)
        const shown = t >= settle ? str : str.split('').map((_, j) => Math.floor(noise(i * 7 + j, Math.floor(t * 24)) * 10)).join('')
        const fl = flash(t, settle, 5)
        txt(shown, chipC[i], y + 130, { size: 46, weight: 600, fam: MONO, align: 'center', color: t >= settle ? CHIP[i] : C.faint, glow: fl * 30 })
        line(chipC[i], y + 70, chipC[i], y + 88, rgba(CHIP[i], 0.5), 2)
      })
    })
    // scanner
    const sc = P(t, K.tokSplit, 0.9)
    if (sc > 0 && sc < 1) {
      const sx = lerp(W / 2 - wFull / 2 - 40, W / 2 + wFull / 2 + 40, E.inOut(sc))
      const g = ctx.createLinearGradient(0, y - 110, 0, y + 110)
      g.addColorStop(0, 'rgba(56,209,224,0)'); g.addColorStop(0.5, 'rgba(56,209,224,0.95)'); g.addColorStop(1, 'rgba(56,209,224,0)')
      ctx.shadowColor = C.cyan; ctx.shadowBlur = 30
      ctx.fillStyle = g; ctx.fillRect(sx - 2, y - 110, 4, 220); ctx.shadowBlur = 0
    }
  })
  // "5 tokens" badge
  const b = Pb(t, K.tokCount, 0.5)
  A(P(t, K.tokCount, 0.2), () => at(W / 2 - 330, 790, b, () => chip(0, 0, '5 tokens', C.cyan, { size: 40, weight: 800, fillA: 0.18, glow: 20 })))
  // rare word split
  const r = Po(t, K.tokCount + 0.35, 0.5)
  A(r, () => {
    txt('rare words split:', W / 2 - 100, 802, { size: 28, weight: 500, color: C.dim })
    chip(W / 2 + 225, 792, 'Token', C.violet, { size: 30, fam: MONO, weight: 400 })
    chip(W / 2 + 375, 792, 'omics', C.pink, { size: 30, fam: MONO, weight: 400 })
    txt('3404  24203', W / 2 + 300, 850, { size: 20, weight: 400, fam: MONO, color: C.faint, align: 'center' })
  })
  // invoice card
  const iv = Po(t, K.tokInvoice, 0.6)
  A(iv, () => {
    const cy = 900 + (1 - iv) * 120
    card(W / 2 - 520, cy, 1040, 92, { fill: C.soft, stroke: rgba(C.yellow, 0.5), r: 16 })
    txt('INVOICE', W / 2 - 490, cy + 57, { size: 22, weight: 800, color: C.yellow, ls: 4 })
    txt('input tokens', W / 2 - 330, cy + 57, { size: 28, weight: 500, color: C.dim })
    txt('5  ×  $3 / 1M  =  $0.000015', W / 2 + 490, cy + 57, { size: 30, weight: 600, fam: MONO, align: 'right' })
  })
}

function sEmbed(t) {
  headline(t, 'Tokens become vectors', cs('e1') - 0.3, 'each ID looks up a learned list of numbers')
  const xs = [250, 440, 630, 820, 1010]
  const top = 330
  TOKS.forEach(([s, id], i) => {
    const a = Po(t, cs('e1') - 0.2 + i * 0.05, 0.5)
    A(a, () => {
      chip(xs[i], top, s.trim(), CHIP[i], { size: 40, weight: 700 })
      txt(String(id), xs[i], top + 60, { size: 22, fam: MONO, weight: 400, align: 'center', color: C.faint })
      for (let j = 0; j < 12; j++) {
        const ca = Po(t, K.embStart + 0.25 + j * 0.07 + i * 0.05, 0.35)
        const v = noise(i * 13 + j, 5 + Math.floor(t * 0.8) * 0) // static values
        const col = v > 0.5 ? C.cyan : C.pink
        const inten = Math.abs(v - 0.5) * 2
        A(ca, () => {
          rr(xs[i] - 62, top + 90 + j * 32 - (1 - ca) * 10, 124, 26, 5)
          ctx.fillStyle = rgba(col, 0.12 + 0.7 * inten * (0.85 + 0.15 * Math.sin(t * 3 + i + j))); ctx.fill()
          txt((v * 2 - 1).toFixed(2), xs[i], top + 90 + j * 32 + 19 - (1 - ca) * 10, { size: 16, fam: MONO, weight: 400, align: 'center', color: rgba(C.text, 0.75) })
        })
      }
      A(Po(t, K.embStart + 1.2, 0.4), () => txt('⋮', xs[i], top + 90 + 12 * 32 + 30, { size: 34, weight: 700, align: 'center', color: C.faint }))
    })
  })
  A(Po(t, K.embStart + 1.4, 0.5), () => txt('8,192 numbers per token', 630, 870, { size: 30, weight: 700, align: 'center', color: C.dim }))
  // meaning as geometry
  const g = Po(t, K.embGeo, 0.7)
  A(g, () => {
    const px = 1200, py = 290, pw = 600, ph = 560
    card(px, py, pw, ph, { fill: rgba(C.card, 0.9), r: 22 })
    txt('Meaning as geometry', px + 30, py + 52, { size: 30, weight: 800 })
    // axes
    ctx.strokeStyle = rgba(C.dim, 0.18); ctx.lineWidth = 1
    for (let k = 1; k < 6; k++) { line(px + 30, py + 80 + k * 80, px + pw - 30, py + 80 + k * 80, rgba(C.dim, 0.08), 1) }
    const pts = [
      ['cat', 0.25, 0.35, C.violet], ['kitten', 0.36, 0.26, C.violet], ['dog', 0.2, 0.55, C.dim], ['puppy', 0.33, 0.6, C.dim],
      ['mat', 0.7, 0.68, C.green], ['rug', 0.8, 0.6, C.green], ['sofa', 0.66, 0.82, C.green],
      ['king', 0.72, 0.2, C.orange], ['queen', 0.84, 0.3, C.orange],
    ]
    const map = (u, v) => [px + 40 + u * (pw - 80), py + 90 + v * (ph - 130)]
    ;[[0, 1], [2, 3], [4, 5], [4, 6], [7, 8]].forEach(([a, b], k) => {
      const f = Po(t, K.embGeo + 0.5 + k * 0.12, 0.5)
      const [x1, y1] = map(pts[a][1], pts[a][2]), [x2, y2] = map(pts[b][1], pts[b][2])
      ctx.setLineDash([6, 6]); line(x1, y1, lerp(x1, x2, f), lerp(y1, y2, f), rgba(pts[a][3], 0.6), 2); ctx.setLineDash([])
    })
    pts.forEach(([n, u, v, c], k) => {
      const f = Pb(t, K.embGeo + 0.1 + k * 0.06, 0.5)
      const [x, y] = map(u + 0.012 * Math.sin(t * 0.9 + k), v + 0.012 * Math.cos(t * 0.8 + k))
      A(clamp(f), () => {
        dot(x, y, 9 * f, c, n === 'cat' ? 24 : 10)
        txt(n, x + 16, y + 8, { size: 24, weight: n === 'cat' ? 800 : 600, color: n === 'cat' ? C.text : C.dim })
      })
    })
  })
}

/* 3D-ish transformer slab */
function slab(x, y, hgt, lit, a, col = C.violet) {
  const d = 34, sk = 26, w = 22
  A(a, () => {
    // side face
    ctx.beginPath(); ctx.moveTo(x + w, y - hgt / 2); ctx.lineTo(x + w + d, y - hgt / 2 - sk); ctx.lineTo(x + w + d, y + hgt / 2 - sk); ctx.lineTo(x + w, y + hgt / 2); ctx.closePath()
    ctx.fillStyle = rgba(col, 0.1 + 0.3 * lit); ctx.fill(); ctx.strokeStyle = rgba(col, 0.35 + 0.4 * lit); ctx.lineWidth = 1.5; ctx.stroke()
    // top face
    ctx.beginPath(); ctx.moveTo(x, y - hgt / 2); ctx.lineTo(x + d, y - hgt / 2 - sk); ctx.lineTo(x + w + d, y - hgt / 2 - sk); ctx.lineTo(x + w, y - hgt / 2); ctx.closePath()
    ctx.fillStyle = rgba(col, 0.25 + 0.4 * lit); ctx.fill(); ctx.stroke()
    // front face
    const g = ctx.createLinearGradient(0, y - hgt / 2, 0, y + hgt / 2)
    g.addColorStop(0, rgba(col, 0.28 + 0.5 * lit)); g.addColorStop(1, rgba(col, 0.1 + 0.3 * lit))
    if (lit > 0.05) { ctx.shadowColor = col; ctx.shadowBlur = 40 * lit }
    ctx.fillStyle = g; ctx.fillRect(x, y - hgt / 2, w, hgt); ctx.shadowBlur = 0
    ctx.strokeStyle = rgba(col, 0.6 + 0.4 * lit); ctx.strokeRect(x, y - hgt / 2, w, hgt)
  })
}
function sLayers(t) {
  headline(t, 'Through the transformer stack', cs('l1') - 0.3, 'about eighty identical layers, one after another')
  const zoom = Po(t, K.attIn, 0.8)
  const baseY = lerp(560, 360, zoom), hgt = lerp(400, 150, zoom)
  const dim = lerp(1, 0.55, zoom)
  // slabs
  A(dim, () => {
    K.slabX.forEach((x, i) => {
      const a = Po(t, K.layIn + i * 0.07, 0.5)
      const lit = flash(t, K.slabPass[i], 3.5) + (zoom > 0 && i === 4 ? 0.6 * zoom : 0)
      slab(x, baseY + (1 - a) * 40, hgt, clamp(lit), a)
    })
    // labels
    A(Po(t, K.layIn + 0.8, 0.5) * (1 - zoom), () => {
      txt('Layer 1', K.slabX[0] + 20, baseY + hgt / 2 + 50, { size: 22, weight: 600, color: C.dim, align: 'center' })
      txt('Layer 80', K.slabX[9] + 20, baseY + hgt / 2 + 50, { size: 22, weight: 600, color: C.dim, align: 'center' })
      txt('· · ·', (K.slabX[4] + K.slabX[5]) / 2 + 20, baseY + hgt / 2 + 50, { size: 22, weight: 700, color: C.faint, align: 'center' })
    })
    // token dots flowing through
    const run = P(t, K.layRun0, K.layRun1 - K.layRun0)
    if (run > 0 && run < 1 && zoom < 1) {
      for (let i = 0; i < 5; i++) {
        const x = lerp(150, 1770, run) - i * 16
        const y = baseY - 90 + i * 45
        for (let k = 1; k < 7; k++) dot(x - k * 14, y, 7 - k, rgba(CHIP[i], 0.18 * (7 - k) / 6))
        dot(x, y, 9, CHIP[i], 20)
      }
    }
    // counter
    A(P(t, K.layRun0, 0.3) * (1 - zoom), () => {
      const n = clamp(Math.round(P(t, K.layRun0, K.layRun1 - K.layRun0) * 80), 1, 80)
      txt('LAYER', 1720, 300, { size: 20, weight: 700, color: C.faint, align: 'right', ls: 4 })
      txt(String(n).padStart(2, '0') + ' / 80', 1720, 350, { size: 44, weight: 600, fam: MONO, align: 'right', color: C.violet })
    })
  })
  // attention panel (zoom into layer 5)
  A(zoom, () => {
    const px = 250, py = 470, pw = 1420, ph = 460
    const sx = K.slabX[4]
    ctx.setLineDash([6, 8])
    line(sx, baseY + hgt / 2, px, py, rgba(C.violet, 0.4), 1.5); line(sx + 22, baseY + hgt / 2, px + pw, py, rgba(C.violet, 0.4), 1.5)
    ctx.setLineDash([])
    card(px, py, pw, ph, { fill: rgba(C.soft, 0.96), stroke: rgba(C.violet, 0.5), r: 24 })
    txt('Attention', px + 36, py + 56, { size: 34, weight: 800, color: C.violet })
    txt('every token looks back at the ones before it', px + 220, py + 55, { size: 26, weight: 500, color: C.dim })
    const xs = [520, 750, 980, 1210, 1440], cy = py + ph - 90
    const W8 = [[2, 0.4], [1, 0.28], [3, 0.16], [0, 0.06]]
    // arcs
    W8.forEach(([j, w], k) => {
      const f = Po(t, K.attArcs[k], 0.7)
      if (f <= 0) return
      const x1 = xs[4], x2 = xs[j], y1 = cy - 45
      const cxp = (x1 + x2) / 2, cyp = y1 - 90 - (x1 - x2) * 0.33
      const hi = (j === 2 ? flash(t, K.attSat, 1.5) : 0) + (j === 1 ? flash(t, K.attCat, 1.5) : 0)
      if (hi > 0.05) { ctx.shadowColor = CHIP[j]; ctx.shadowBlur = 30 * hi }
      qcurve(x1, y1, cxp, cyp, x2, y1, f, rgba(CHIP[j], 0.35 + 0.55 * Math.min(1, w * 3) + 0.2 * hi), 3 + w * 30)
      ctx.shadowBlur = 0
      // particles flowing toward the query
      if (f >= 1) for (let q = 0; q < 3; q++) {
        const s = 1 - ((t * 0.55 + q / 3 + k * 0.17) % 1)
        const [qx, qy] = qpt(x1, y1, cxp, cyp, x2, y1, s)
        dot(qx, qy, 4 + w * 8, rgba('#ffffff', 0.85), 12)
      }
    })
    W8.forEach(([j, w], k) => {
      const x1 = xs[4], x2 = xs[j], y1 = cy - 45
      const [lx, ly] = qpt(x1, y1, (x1 + x2) / 2, y1 - 90 - (x1 - x2) * 0.33, x2, y1, 0.86)
      A(P(t, K.attArcs[k] + 0.4, 0.3), () => chip(lx, ly - 6, w.toFixed(2), CHIP[j], { size: 22, fam: MONO, weight: 600, fillA: 0.95, strokeA: 1, textColor: C.bg }))
    })
    TOKS.forEach(([s], i) => {
      const hi = (i === 2 ? flash(t, K.attSat, 2) : 0) + (i === 1 ? flash(t, K.attCat, 2) : 0)
      at(xs[i], cy, 1 + 0.15 * hi, () => chip(0, 0, s.trim(), CHIP[i], { size: 40, weight: 700, glow: 30 * hi + (i === 4 ? 16 : 0) }))
    })
    txt('query', xs[4], cy + 62, { size: 20, weight: 700, color: C.pink, align: 'center', ls: 3 })
  })
}

const DISTS = [
  [['mat', 50], ['floor', 18], ['sofa', 13], ['windowsill', 10], ['keyboard', 9]],
  [['.', 40], [',', 24], ['and', 20], ['all', 16]],
  [['purring', 38], ['and', 32], ['watching', 30]],
  [['softly', 46], ['loudly', 30], ['.', 24]],
  [['.', 100]],
]
const CHOSEN = [0, 1, 0, 0, 0]
const STREAM = [' mat', ',', ' purring', ' softly', '.']
function sPredict(t) {
  headline(t, 'One score for every possible next token', cs('p1') - 0.3)
  // which distribution is showing
  let k = 0
  for (let i = 1; i < 5; i++) if (t >= K.stream[i] - 0.45) k = i
  const nShown = K.stream.filter((x) => t >= x).length // tokens streamed
  // input card (left)
  const inA = Po(t, cs('p1') - 0.2, 0.6)
  A(inA, () => {
    card(110, 280, 700, 150, { fill: rgba(C.card, 0.9), r: 20 })
    txt('INPUT', 140, 322, { size: 18, weight: 800, color: C.faint, ls: 4 })
    let x = 140
    const items = TOKS.map((x) => x[0].trim()).concat(STREAM.slice(0, Math.max(0, nShown)).map((s) => s.trim()))
    const size = items.length > 8 ? 21 : items.length > 6 ? 25 : 30
    items.forEach((s, i) => {
      const w = chipW(s, size)
      const isNew = i >= 5
      const a = isNew ? P(t, K.stream[i - 5], 0.25) : 1
      A(a, () => chip(x + w / 2, 380, s, isNew ? C.green : CHIP[i], { size, weight: 700, glow: isNew ? 14 * flash(t, K.stream[i - 5], 2) : 0 }))
      x += w + (items.length > 8 ? 5 : 8)
    })
    // empty slot
    if (x < 780 && nShown < 5) {
      const w = 60
      rr(x, 380 - 24, w, 48, 10); ctx.setLineDash([6, 6]); ctx.strokeStyle = rgba(C.text, 0.4 + 0.3 * Math.sin(t * 5)); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([])
      txt('?', x + w / 2, 390, { size: 28, weight: 700, align: 'center', color: C.dim })
    }
    // mini stack
    const run = Math.max(flash(t, K.preRun, 2), ...K.stream.slice(1).map((s) => flash(t, s - 0.12, 4)))
    for (let i = 0; i < 7; i++) slab(210 + i * 62, 600, 150, clamp(run * (0.6 + 0.4 * noise(i, 3))), 1)
    txt('the whole stack', 330, 720, { size: 24, weight: 600, color: C.dim, align: 'center' })
    // arrow to chart
    ctx.strokeStyle = rgba(C.text, 0.4); ctx.lineWidth = 3
    line(700, 600, 820, 600, rgba(C.text, 0.4), 3)
    ctx.beginPath(); ctx.moveTo(820, 588); ctx.lineTo(836, 600); ctx.lineTo(820, 612); ctx.fillStyle = rgba(C.text, 0.4); ctx.fill()
  })
  // bar chart (right)
  const cx0 = 880, cy0 = 280, cwid = 920
  A(Po(t, K.preBars - 0.3, 0.5), () => {
    card(cx0, cy0, cwid, 520, { fill: rgba(C.card, 0.9), r: 20 })
    txt('Next-token probability', cx0 + 30, cy0 + 52, { size: 28, weight: 800 })
    txt('scored across ~100,000 possible tokens', cx0 + 30, cy0 + 88, { size: 22, weight: 500, color: C.dim })
    const d = DISTS[k]
    const rowY = (i) => cy0 + 150 + i * 62
    for (let i = 0; i < 5; i++) {
      const it = d[i]
      if (!it) continue
      const grow = k === 0 ? Po(t, K.preBars + 0.12 * i, 0.6) : Po(t, K.stream[k] - 0.45 + 0.05 * i, 0.4)
      const chosen = i === CHOSEN[k]
      const pickT = k === 0 ? K.prePick : K.stream[k] - 0.15
      const picked = t >= pickT && chosen
      // roulette highlight on the first distribution
      let hl = 0
      if (k === 0) { const r = [...K.roulette].reverse().find((r) => t >= r.t); if (r && t < K.prePick + 0.01 && r.idx === i) hl = 1 }
      const bw = 520 * (it[1] / 100) * grow * (k === 4 ? 0.9 : 1.6)
      const col = picked ? C.green : hl ? C.yellow : C.violet
      txt(it[0], cx0 + 230, rowY(i) + 10, { size: 28, weight: 600, fam: MONO, align: 'right', color: picked ? C.green : C.text })
      rr(cx0 + 250, rowY(i) - 18, Math.max(bw, 4), 36, 8)
      if (picked || hl) { ctx.shadowColor = col; ctx.shadowBlur = 24 }
      ctx.fillStyle = rgba(col, picked || hl ? 0.95 : 0.55); ctx.fill(); ctx.shadowBlur = 0
      txt(it[1] + '%', cx0 + 262 + Math.max(bw, 4), rowY(i) + 9, { size: 24, weight: 600, fam: MONO, color: C.dim })
    }
    A(k === 0 ? Po(t, K.preBars + 0.7, 0.4) : 1, () => txt('… ~100K more, each near 0%', cx0 + 250, cy0 + 490, { size: 22, weight: 500, color: C.faint }))
    // sampler tag
    A(P(t, K.preWin - 0.6, 0.3) * (1 - P(t, K.preFly, 0.3)), () => chip(cx0 + cwid - 130, cy0 + 50, 'sampler', C.yellow, { size: 24, weight: 700 }))
  })
  // fly-back arc: chosen token back into the input
  const fly = P(t, K.preFly, 0.9)
  if (fly > 0 && fly < 1) {
    const [x1, y1, x2, y2] = [cx0 + 330, cy0 + 150, 700, 380]
    const cxp = (x1 + x2) / 2, cyp = 200
    qcurve(x1, y1, cxp, cyp, x2, y2, 1, rgba(C.green, 0.25), 3)
    const [x, y] = qpt(x1, y1, cxp, cyp, x2, y2, E.inOut(fly))
    chip(x, y, 'mat', C.green, { size: 34, weight: 700, glow: 30 })
  }
  A(P(t, K.preFly, 0.4), () => {
    const x1 = cx0 + 330, y1 = cy0 + 150, x2 = 700, y2 = 380
    ctx.setLineDash([8, 10]); ctx.lineDashOffset = -t * 40
    qcurve(x1, y1, (x1 + x2) / 2, 200, x2, y2, 1, rgba(C.green, 0.3), 2)
    ctx.setLineDash([]); ctx.lineDashOffset = 0
    txt('↺ fed straight back in', 780, 322, { size: 20, weight: 700, color: C.green, align: 'right' })
  })
  // streaming answer
  const sa = Po(t, K.preLand - 0.3, 0.5)
  A(sa, () => {
    const y = 850
    card(110, y, 1690, 130, { fill: C.soft, stroke: rgba(C.green, 0.4), r: 20 })
    txt('STREAMING', 140, y + 42, { size: 18, weight: 800, color: C.green, ls: 4 })
    font(44, 600)
    let s = 'The cat sat on the'
    txt(s, 140, y + 100, { size: 44, weight: 600, color: C.dim })
    let x = 140 + tw(s, 44, 600)
    STREAM.forEach((tok, i) => {
      if (t < K.stream[i]) return
      const f = flash(t, K.stream[i], 3)
      txt(tok, x, y + 100, { size: 44, weight: 700, color: f > 0.2 ? C.green : C.text, glow: 20 * f })
      x += tw(tok, 44, 700)
    })
    if (Math.floor(t * 2.4) % 2) txt('▍', x + 4, y + 100, { size: 44, weight: 600, color: C.green })
    txt('forward passes', 1770, y + 50, { size: 20, weight: 600, color: C.faint, align: 'right' })
    txt(String(nShown), 1770, y + 104, { size: 48, weight: 700, fam: MONO, color: C.green, align: 'right' })
  })
}

function sPrefill(t) {
  headline(t, 'Reading is cheap. Writing is not.', K.pfIn - 0.2, 'every request runs in two phases')
  const dimAll = 1 - 0.6 * Po(t, K.discDim, 0.5)
  const L = { x: 110, y: 270, w: 830, h: 470 }, R = { x: 980, y: 270, w: 830, h: 470 }
  // PREFILL
  const la = Po(t, K.pfIn + 0.1, 0.6)
  A(la * dimAll, () => {
    const ox = -(1 - la) * 120
    const fl = flash(t, K.pfFlash, 2.2)
    card(L.x + ox, L.y, L.w, L.h, { fill: rgba(C.card, 0.92), stroke: rgba(C.cyan, 0.45 + 0.5 * fl), r: 24, glow: fl > 0.05 ? C.cyan : null, glowA: fl * 0.6 })
    txt('PREFILL', L.x + ox + 36, L.y + 60, { size: 34, weight: 800, color: C.cyan, ls: 3 })
    txt('reading your prompt', L.x + ox + 230, L.y + 58, { size: 26, weight: 500, color: C.dim })
    for (let i = 0; i < 48; i++) {
      const cx = L.x + ox + 44 + (i % 12) * 62, cy = L.y + 100 + Math.floor(i / 12) * 62
      const on = P(t, K.pfFlash + (i % 12) * 0.012, 0.15)
      rr(cx, cy, 50, 50, 9)
      ctx.fillStyle = on > 0 ? rgba(C.cyan, 0.2 + 0.6 * on * (0.6 + 0.4 * fl)) : rgba(C.dim, 0.08)
      if (fl > 0.3 && on > 0) { ctx.shadowColor = C.cyan; ctx.shadowBlur = 20 * fl }
      ctx.fill(); ctx.shadowBlur = 0
    }
    const items = [['one parallel pass', K.pfFlash + 0.2], ['compute-bound', K.pfFlash + 0.6], ['fast and cheap', K.pfFast]]
    { let ix = L.x + ox + 44; items.forEach(([s, a], i) => { const x = ix; A(Po(t, a, 0.4), () => txt('✓ ' + s, x, L.y + 400, { size: 25, weight: 600, color: i === 2 ? C.cyan : C.text })); ix += tw('✓ ' + s, 25, 600) + 30 }) }
    A(P(t, K.pfFlash + 0.2, 0.3), () => txt('≈ 0.2 s', L.x + ox + L.w - 36, L.y + 60, { size: 26, weight: 600, fam: MONO, color: C.cyan, align: 'right' }))
  })
  // DECODE
  const ra = Po(t, K.pfIn + 0.35, 0.6)
  A(ra * dimAll, () => {
    const ox = (1 - ra) * 120
    const n = clamp(Math.floor((t - K.dcStart) / K.dcStep) + 1, 0, 12)
    const lastT = K.dcStart + (n - 1) * K.dcStep
    card(R.x + ox, R.y, R.w, R.h, { fill: rgba(C.card, 0.92), stroke: rgba(C.pink, 0.5), r: 24 })
    txt('DECODE', R.x + ox + 36, R.y + 60, { size: 34, weight: 800, color: C.pink, ls: 3 })
    txt('writing the answer', R.x + ox + 215, R.y + 58, { size: 26, weight: 500, color: C.dim })
    for (let i = 0; i < 12; i++) {
      const cx = R.x + ox + 44 + (i % 6) * 124, cy = R.y + 100 + Math.floor(i / 6) * 62
      const on = i < n
      const f = on ? flash(t, K.dcStart + i * K.dcStep, 5) : 0
      rr(cx, cy, 112, 50, 9)
      ctx.fillStyle = on ? rgba(C.pink, 0.35 + 0.5 * f) : rgba(C.dim, 0.08)
      if (f > 0.1) { ctx.shadowColor = C.pink; ctx.shadowBlur = 24 * f }
      ctx.fill(); ctx.shadowBlur = 0
      if (!on && i === n && t > K.dcStart - 0.5) { ctx.strokeStyle = rgba(C.pink, 0.4 + 0.4 * Math.sin(t * 8)); ctx.lineWidth = 2; ctx.stroke() }
    }
    // weight read meter
    const my = R.y + 262
    txt('weights re-read from memory', R.x + ox + 44, my, { size: 22, weight: 600, color: C.dim })
    const rd = n > 0 ? P(t, lastT, K.dcStep * 0.8) : 0
    rr(R.x + ox + 44, my + 18, 740, 30, 8); ctx.fillStyle = rgba(C.dim, 0.1); ctx.fill()
    rr(R.x + ox + 44, my + 18, 740 * rd, 30, 8); ctx.fillStyle = rgba(C.violet, 0.8); ctx.fill()
    txt('140 GB', R.x + ox + 44 + 740 - 10, my + 41, { size: 20, weight: 600, fam: MONO, align: 'right', color: C.text })
    txt(`× ${n} token${n === 1 ? '' : 's'}  =  ${fmt(140 * n)} GB read`, R.x + ox + 44, my + 86, { size: 24, weight: 600, fam: MONO, color: C.violet })
    const items = [['one token at a time', K.dcStart], ['memory-bound', K.dcReread + 0.3], ['slow and costly', K.dcReread + 1.0]]
    { let ix = R.x + ox + 44; items.forEach(([s, a], i) => { const x = ix; A(Po(t, a, 0.4), () => txt('✕ ' + s, x, R.y + 400, { size: 25, weight: 600, color: i === 2 ? C.pink : C.text })); ix += tw('✕ ' + s, 25, 600) + 30 }) }
  })
  // price comparison
  const pa = Po(t, K.price, 0.6)
  A(pa * dimAll, () => {
    const y = 800
    txt('Input price', 110, y + 38, { size: 26, weight: 600, color: C.dim })
    txt('Output price', 110, y + 108, { size: 26, weight: 600, color: C.dim })
    const unit = 150
    rr(300, y + 12, unit, 36, 8); ctx.fillStyle = rgba(C.cyan, 0.85); ctx.fill()
    txt('1×', 300 + unit + 14, y + 40, { size: 26, weight: 700, fam: MONO, color: C.cyan })
    const g = Po(t, K.price + 0.4, 1.2)
    const w3 = unit * 3 * Math.min(1, g * 1.6), w8 = unit * 8 * g
    const grad = ctx.createLinearGradient(300 + unit * 3, 0, 300 + unit * 8, 0)
    grad.addColorStop(0, rgba(C.pink, 0.7)); grad.addColorStop(1, rgba(C.pink, 0.1))
    rr(300, y + 82, w8, 36, 8); ctx.fillStyle = grad; ctx.fill()
    rr(300, y + 82, w3, 36, 8); ctx.fillStyle = rgba(C.pink, 0.9); ctx.fill()
    A(P(t, K.price + 1.3, 0.4), () => {
      line(300 + unit * 3, y + 70, 300 + unit * 3, y + 130, C.text, 2); line(300 + unit * 8, y + 70, 300 + unit * 8, y + 130, C.text, 2)
      txt('3×', 300 + unit * 3, y + 160, { size: 22, weight: 700, fam: MONO, align: 'center', color: C.dim })
      txt('8×', 300 + unit * 8, y + 160, { size: 22, weight: 700, fam: MONO, align: 'center', color: C.dim })
      txt('3 – 8× input', 300 + unit * 8 + 30, y + 110, { size: 40, weight: 800, color: C.pink, glow: 18 })
    })
  })
  // discounts
  ;[['CACHED PROMPT', '~90% off', 'a stable prefix skips the re-read', C.green, K.disc1, -1], ['BATCH LANE', '50% off', 'shared weight reads, idle GPUs', C.cyan, K.disc2, 1]].forEach(([k, big, sub, col, t0, side]) => {
    const s = Pb(t, t0, 0.6)
    A(P(t, t0, 0.2), () => at(W / 2 + side * 380, 560, s, () => {
      card(-330, -150, 660, 300, { fill: rgba(C.soft, 0.97), stroke: col, r: 28, lw: 3, glow: col, glowA: 0.45 })
      txt(k, 0, -80, { size: 24, weight: 800, color: col, align: 'center', ls: 5 })
      txt(big, 0, 30, { size: 96, weight: 800, align: 'center', glow: 20, color: C.text })
      txt(sub, 0, 95, { size: 26, weight: 500, color: C.dim, align: 'center' })
    }))
  })
}

const DIALS = [
  { name: 'Tokenizer', owner: 0 }, { name: 'Architecture', owner: 0 },
  { name: 'Precision', owner: 1 }, { name: 'Batching', owner: 1 }, { name: 'Context you send', owner: 2 },
]
const OWNERS = [['Model maker', C.violet], ['Whoever serves it', C.cyan], ['You', C.green]]
function knob(x, y, r, i, t, activeK, dimK) {
  const d = DIALS[i], col = OWNERS[d.owner][1]
  const turn = i < K.dial.length ? Po(t, K.dial[i], 0.8) : 0
  const ang = (-225 + 50 * i * 0 + 60 + 150 * turn) * Math.PI / 180
  A(1 - 0.65 * dimK, () => at(x, y, 1 + 0.14 * activeK, () => {
    // ticks
    for (let k = 0; k <= 20; k++) {
      const a = (-225 + k * 13.5) * Math.PI / 180
      const on = a <= ang + 0.01
      line(Math.cos(a) * (r + 10), Math.sin(a) * (r + 10), Math.cos(a) * (r + 22), Math.sin(a) * (r + 22), on ? rgba(col, 0.9) : rgba(C.dim, 0.25), 3)
    }
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2)
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 4, 0, 0, r)
    g.addColorStop(0, C.card2); g.addColorStop(1, C.soft)
    if (activeK > 0.05) { ctx.shadowColor = col; ctx.shadowBlur = 40 * activeK }
    ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0
    ctx.strokeStyle = rgba(col, 0.6 + 0.4 * activeK); ctx.lineWidth = 3; ctx.stroke()
    // pointer
    line(Math.cos(ang) * r * 0.35, Math.sin(ang) * r * 0.35, Math.cos(ang) * r * 0.82, Math.sin(ang) * r * 0.82, col, 6)
    dot(Math.cos(ang) * r * 0.82, Math.sin(ang) * r * 0.82, 5, col, 12)
    txt(String(i + 1), 0, 12, { size: 34, weight: 800, align: 'center', color: C.text })
    txt(d.name, 0, r + 62, { size: 26, weight: 700, align: 'center' })
    txt(OWNERS[d.owner][0], 0, r + 94, { size: 20, weight: 600, align: 'center', color: col })
  }))
}
function sDials(t) {
  headline(t, 'Five hidden dials on your bill', cs('d0') - 0.3)
  // which dial is active (with a soft crossfade)
  const actK = DIALS.map((_, i) => Po(t, K.dial[i], 0.5) * (1 - P(t, K.dialEnd[i] - 0.35, 0.35)))
  const anyActive = Math.max(...actK)
  const ky = lerp(370, 340, Po(t, K.dial[0], 0.6))
  DIALS.forEach((_, i) => {
    const a = Pb(t, K.knobIn[i], 0.5)
    A(P(t, K.knobIn[i], 0.2), () => at(K.knobX[i], ky, clamp(a, 0, 1.2), () => knob(0, 0, 66, i, t, actK[i], anyActive * (1 - actK[i]))))
  })
  // owner brackets (before the first dial)
  const bA = 1 - P(t, K.dial[0] - 0.4, 0.4)
  A(bA, () => {
    ;[[0, 1], [2, 3], [4, 4]].forEach(([a, b], k) => {
      const f = Po(t, K.own[k], 0.5)
      A(f, () => {
        const x1 = K.knobX[a] - 110, x2 = K.knobX[b] + 110, y = ky + 200
        const col = OWNERS[k][1]
        ctx.strokeStyle = col; ctx.lineWidth = 3
        ctx.beginPath(); ctx.moveTo(x1, y - 14); ctx.lineTo(x1, y); ctx.lineTo(x2, y); ctx.lineTo(x2, y - 14); ctx.stroke()
        txt(OWNERS[k][0], (x1 + x2) / 2, y + 50, { size: 32, weight: 800, align: 'center', color: col })
        txt(['fixed when the model was built', 'chosen by the provider', 'your call, request by request'][k], (x1 + x2) / 2, y + 88, { size: 22, weight: 500, align: 'center', color: C.dim })
      })
    })
  })
  // content panel
  const PX = 150, PY = 600, PW = 1620, PH = 390
  A(anyActive, () => card(PX, PY, PW, PH, { fill: rgba(C.soft, 0.92), r: 24 }))
  const panels = [dTokenizer, dArch, dPrecision, dBatch, dContext]
  panels.forEach((fn, i) => A(actK[i], () => fn(t, PX, PY, PW, PH)))
}
function panelTitle(s, sub, x, y, col) {
  txt(s, x + 40, y + 58, { size: 32, weight: 800, color: col })
  txt(sub, x + 40 + tw(s, 32, 800) + 20, y + 57, { size: 24, weight: 500, color: C.dim })
}
function dTokenizer(t, x, y, w) {
  panelTitle('Same sentence, different bill', 'the vocabulary is built mostly from English', x, y, C.violet)
  const rows = [['English', 8], ['German', 18], ['Japanese', 20], ['Hindi', 55]]
  rows.forEach(([l, n], i) => {
    const g = Po(t, K.d1Bars + 0.14 * i, 0.6)
    const ry = y + 120 + i * 62
    const isH = l === 'Hindi', hi = isH ? Po(t, K.d1Hindi, 0.4) : 0
    txt(l, x + 200, ry + 10, { size: 26, weight: 600, align: 'right', color: isH && hi ? C.yellow : C.text })
    const bw = 1000 * (n / 55) * g
    rr(x + 230, ry - 20, bw, 40, 8)
    if (hi) { ctx.shadowColor = C.yellow; ctx.shadowBlur = 24 * hi }
    ctx.fillStyle = isH && hi ? rgba(C.yellow, 0.9) : rgba(C.violet, 0.65); ctx.fill(); ctx.shadowBlur = 0
    txt(n + ' tokens', x + 245 + bw, ry + 9, { size: 22, weight: 600, fam: MONO, color: C.dim })
  })
  A(Po(t, K.d1Hindi + 0.1, 0.5), () => {
    txt('कृत्रिम बुद्धिमत्ता उद्यम अर्थशास्त्र को बदल रही है।', x + 230, y + 370, { size: 26, weight: 400, fam: 'Noto Sans Devanagari', color: C.dim })
    at(x + w - 150, y + 250, Pb(t, K.d1Hindi + 0.1, 0.5), () => chip(0, 0, '6.9×', C.yellow, { size: 64, weight: 800, glow: 24 }))
  })
}
function expertGrid(cx, cy, litFn, col, a) {
  for (let i = 0; i < 16; i++) {
    const gx = cx - 150 + (i % 8) * 38, gy = cy + Math.floor(i / 8) * 44
    const lit = litFn(i)
    rr(gx, gy, 30, 36, 6)
    if (lit) { ctx.shadowColor = col; ctx.shadowBlur = 16 }
    ctx.fillStyle = lit ? rgba(col, 0.9) : rgba(C.dim, 0.12); ctx.fill(); ctx.shadowBlur = 0
  }
}
function dArch(t, x, y, w) {
  panelTitle('Only the active parameters cost you', 'mixture of experts vs dense', x, y, C.violet)
  const m = Po(t, K.d2MoE, 0.5), d = Po(t, K.d2Dense, 0.5)
  A(m, () => {
    const cx = x + 420, cy = y + 150
    txt('Mixture of experts · 1T', cx, cy - 20, { size: 28, weight: 700, align: 'center' })
    const step = Math.floor(t / 0.45)
    const e1 = Math.floor(noise(step, 1) * 16), e2 = (e1 + 1 + Math.floor(noise(step, 2) * 15)) % 16
    expertGrid(cx, cy + 10, (i) => i === e1 || i === e2, C.violet)
    txt('reads ~37B per token', cx, cy + 150, { size: 30, weight: 700, align: 'center', color: C.violet })
    txt('2 of 16 experts awake', cx, cy + 190, { size: 22, weight: 500, align: 'center', color: C.dim })
  })
  A(d, () => {
    const cx = x + 1150, cy = y + 150
    txt('Dense · 70B', cx, cy - 20, { size: 28, weight: 700, align: 'center' })
    expertGrid(cx, cy + 10, () => true, C.pink)
    txt('reads 70B per token', cx, cy + 150, { size: 30, weight: 700, align: 'center', color: C.pink })
    txt('every weight, every time', cx, cy + 190, { size: 22, weight: 500, align: 'center', color: C.dim })
  })
  A(P(t, K.d2Cheap, 0.2), () => at(x + 420, y + 64, Pb(t, K.d2Cheap, 0.5), () => chip(260, 0, 'cheaper to serve', C.green, { size: 26, weight: 800, glow: 18 })))
  A(d, () => txt('vs', x + 785, y + 235, { size: 34, weight: 800, align: 'center', color: C.faint }))
}
function dPrecision(t, x, y) {
  panelTitle('Fewer bits, less to read', 'GB of weights read per token · 70B model', x, y, C.cyan)
  const rows = [['16-bit', 140], ['8-bit', 70], ['4-bit', 35]]
  rows.forEach(([l, gb], i) => {
    const g = Po(t, K.d3[i], 0.6)
    const cur = i === K.d3.filter((a) => t >= a).length - 1
    const ry = y + 140 + i * 78
    A(clamp(g * 2), () => {
      txt(l, x + 200, ry + 12, { size: 30, weight: 700, align: 'right', fam: MONO, color: cur ? C.cyan : C.dim })
      rr(x + 230, ry - 24, 1100 * (gb / 140) * g, 48, 10)
      if (cur) { ctx.shadowColor = C.cyan; ctx.shadowBlur = 20 }
      ctx.fillStyle = cur ? rgba(C.cyan, 0.9) : rgba(C.violet, 0.45); ctx.fill(); ctx.shadowBlur = 0
      txt(gb + ' GB', x + 250 + 1100 * (gb / 140) * g, ry + 10, { size: 26, weight: 700, fam: MONO, color: C.text })
      if (i > 0) txt('÷2', x + 1480, ry + 10, { size: 30, weight: 800, color: C.green })
    })
  })
}
function batchCost(n) { const single = (26.8e12 * 0.82) / 140e9; return (36 / (Math.min(single * n, 3.2e15 / 140e9) * 3600)) * 1e6 }
function dBatch(t, x, y, w) {
  panelTitle('One weight read, shared by the whole batch', 'the biggest lever on cost per token', x, y, C.cyan)
  const f = P(t, K.d4Fill0, K.d4Fill1 - K.d4Fill0)
  const n = Math.max(1, Math.round(1 + 31 * E.inOut(f)))
  // weights block
  const wx = x + 60, wy = y + 130
  const pulse = 0.5 + 0.5 * Math.sin(t * 6)
  card(wx, wy, 190, 200, { fill: rgba(C.violet, 0.2), stroke: C.violet, r: 16, glow: C.violet, glowA: 0.3 + 0.2 * pulse })
  txt('weights', wx + 95, wy + 90, { size: 28, weight: 800, align: 'center' })
  txt('140 GB', wx + 95, wy + 128, { size: 24, weight: 600, fam: MONO, align: 'center', color: C.dim })
  txt('read once', wx + 95, wy + 166, { size: 20, weight: 600, align: 'center', color: C.violet })
  for (let i = 0; i < 32; i++) {
    const cx = x + 330 + (i % 16) * 44, cy = y + 150 + Math.floor(i / 16) * 100
    const on = i < n
    if (on) { ctx.globalAlpha *= 0.25; line(wx + 190, wy + 100, cx + 17, cy + 20, C.cyan, 1.2); ctx.globalAlpha /= 0.25 }
    rr(cx, cy, 34, 40, 7)
    ctx.fillStyle = on ? rgba(C.green, 0.85) : rgba(C.dim, 0.1); ctx.fill()
  }
  txt(`${n}× requests together`, x + 330, y + 350, { size: 28, weight: 700, fam: MONO, color: C.green })
  // cost
  const cx = x + 1120
  txt('cost per 1M output tokens', cx, y + 150, { size: 24, weight: 600, color: C.dim })
  const cost = batchCost(n)
  txt('$' + cost.toFixed(2), cx, y + 250, { size: 96, weight: 800, fam: MONO, color: n > 1 ? C.green : C.pink, glow: 16 })
  A(P(t, K.d4Cut + 0.3, 0.2), () => at(cx + 110, y + 330, Pb(t, K.d4Cut + 0.3, 0.5), () => chip(0, 0, '−97%', C.green, { size: 40, weight: 800, glow: 24 })))
  A(Po(t, K.d4Cut + 0.3, 0.4), () => txt('from $63.71', cx + 210, y + 342, { size: 24, weight: 600, fam: MONO, color: C.faint }))
}
function dContext(t, x, y) {
  panelTitle('Everything is re-sent, every turn', 'system prompt 1,200 tok · +400 tok per turn', x, y, C.green)
  const f = P(t, K.d5Rows0, K.d5Rows1 - K.d5Rows0)
  const n = clamp(Math.floor(f * 9.999) + 1, 1, 10)
  const sc = 0.17
  const rs = flash(t, K.d5Resent, 1) + (t > K.d5Resent ? 0.25 : 0)
  for (let k = 1; k <= n; k++) {
    const ry = y + 88 + (k - 1) * 25
    const a = Po(t, lerp(K.d5Rows0, K.d5Rows1, (k - 1) / 9), 0.3)
    A(a, () => {
      txt('turn ' + k, x + 150, ry + 16, { size: 16, weight: 400, fam: MONO, align: 'right', color: C.faint })
      let bx = x + 165
      rr(bx, ry, 1200 * sc - 3, 19, 4); ctx.fillStyle = rgba(C.violet, 0.75 + 0.25 * rs)
      if (rs > 0.3) { ctx.shadowColor = C.pink; ctx.shadowBlur = 14 * rs }
      ctx.fill(); ctx.shadowBlur = 0; bx += 1200 * sc
      if (k > 1) { rr(bx, ry, 400 * (k - 1) * sc - 3, 19, 4); ctx.fillStyle = rgba(C.cyan, 0.55); ctx.fill(); bx += 400 * (k - 1) * sc }
      rr(bx, ry, 400 * sc - 3, 19, 4); ctx.fillStyle = rgba(C.green, 0.85); ctx.fill()
    })
  }
  // legend
  ;[['system prompt', C.violet], ['history', C.cyan], ['new message', C.green]].forEach(([l, c], i) => {
    rr(x + 165 + i * 230, y + 352, 18, 18, 4); ctx.fillStyle = c; ctx.fill()
    txt(l, x + 192 + i * 230, y + 367, { size: 20, weight: 600, color: C.dim })
  })
  let cum = 0
  for (let i = 1; i <= n; i++) cum += 1200 + 400 * i
  const rx = x + 1180
  txt('system prompt billed', rx, y + 140, { size: 24, weight: 600, color: C.dim })
  txt(n + '×', rx, y + 235, { size: 92, weight: 800, color: C.pink, glow: 16 })
  txt(fmt(cum) + ' tokens billed', rx, y + 300, { size: 28, weight: 700, fam: MONO, color: C.text })
  txt('vs ' + fmt((1200 + 400) * n) + ' if context were free', rx, y + 338, { size: 22, weight: 500, fam: MONO, color: C.faint })
}

function sOutro(t) {
  const fin = Po(t, K.outFinal, 0.8)
  const cards = [
    ['Sequential generation', 'one full pass per output token', C.pink, 'loop'],
    ['Memory', 'the KV cache lives on the GPU', C.cyan, 'mem'],
    ['Weight reads', 'every weight, every token', C.violet, 'stack'],
  ]
  A(1 - fin, () => {
    cards.forEach(([h, s, col, icon], i) => {
      const k = Pb(t, K.outCards[i], 0.6)
      const cx = 440 + i * 520, cy = 460
      A(P(t, K.outCards[i], 0.25), () => at(cx, cy + (1 - clamp(k)) * 60, 1, () => {
        card(-230, -190, 460, 380, { fill: rgba(C.card, 0.95), stroke: rgba(col, 0.7), r: 26, lw: 2, glow: col, glowA: 0.35 * flash(t, K.outCards[i], 1.2) + 0.1 })
        // icons
        if (icon === 'loop') {
          ctx.beginPath(); ctx.arc(0, -60, 54, 0.3, Math.PI * 1.85); ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt'
          const a = Math.PI * 1.85; const ex = Math.cos(a) * 54, ey = -60 + Math.sin(a) * 54
          ctx.beginPath(); ctx.moveTo(ex + 18, ey - 4); ctx.lineTo(ex - 4, ey - 18); ctx.lineTo(ex - 2, ey + 12); ctx.fillStyle = col; ctx.fill()
          const r = t * 2.2; dot(Math.cos(r) * 54, -60 + Math.sin(r) * 54, 9, '#fff', 16)
        } else if (icon === 'mem') {
          rr(-70, -120, 140, 110, 12); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.stroke()
          for (let j = 0; j < 5; j++) { line(-50 + j * 25, -120, -50 + j * 25, -140, col, 5); line(-50 + j * 25, -10, -50 + j * 25, 10, col, 5) }
          for (let j = 0; j < 3; j++) { rr(-48, -100 + j * 28, 96, 16, 4); ctx.fillStyle = rgba(col, 0.3 + 0.6 * ((Math.sin(t * 3 + j) + 1) / 2)); ctx.fill() }
        } else {
          for (let j = 0; j < 4; j++) slab(-70 + j * 36, -60, 110, clamp(flash(t, K.outCards[2] + 0.2 + j * 0.15, 2)), 1, col)
        }
        txt(h, 0, 80, { size: 34, weight: 800, align: 'center', color: col })
        txt(s, 0, 125, { size: 22, weight: 500, align: 'center', color: C.dim })
      }))
    })
    A(Po(t, K.outLine, 0.6), () => txt('The machine behind every price in this guide.', W / 2, 800, { size: 44, weight: 700, align: 'center' }))
  })
  // final card
  A(fin, () => {
    const y = 470
    const s1 = 'LLM ', s2 = 'Tokenomics'
    const wAll = tw(s1 + s2, 130, 800), x0 = W / 2 - wAll / 2
    txt(s1, x0, y + (1 - fin) * 30, { size: 130, weight: 800 })
    const gx = x0 + tw(s1, 130, 800)
    const g = ctx.createLinearGradient(gx, 0, gx + tw(s2, 130, 800), 0); g.addColorStop(0, C.cyan); g.addColorStop(1, C.violet)
    font(130, 800); ctx.fillStyle = g; ctx.textAlign = 'left'; ctx.shadowColor = rgba(C.violet, 0.6); ctx.shadowBlur = 30
    ctx.fillText(s2, gx, y + (1 - fin) * 30); ctx.shadowBlur = 0
    A(Po(t, K.outFinal + 0.6, 0.6), () => txt('Open each chapter — and try the dials yourself.', W / 2, y + 90, { size: 40, weight: 500, align: 'center', color: C.dim }))
    const labels = CHAPTERS.map((c) => c.num + '  ' + c.label)
    const ws = labels.map((l) => chipW(l, 28))
    let x = W / 2 - (ws.reduce((a, b) => a + b, 0) + 40) / 2
    labels.forEach((l, i) => {
      const s = Pb(t, K.outFinal + 1.0 + i * 0.2, 0.5)
      const cx = x + ws[i] / 2
      A(P(t, K.outFinal + 1.0 + i * 0.2, 0.2), () => at(cx, y + 210, s, () => chip(0, 0, l, CHAPTERS[i].color, { size: 28, fillA: 0.12 })))
      x += ws[i] + 20
    })
  })
}

const SCENES = { title: sTitle, context: sContext, tokenize: sTokenize, embed: sEmbed, layers: sLayers, predict: sPredict, prefill: sPrefill, dials: sDials, outro: sOutro }
function sceneAlpha(s, t) {
  const first = s.start === 0, last = s.end >= TIM.total
  const fi = first ? P(t, 0, 0.5) : P(t, s.start, 0.55)
  const fo = last ? 1 - P(t, TIM.total - 1.3, 1.2) : 1 - P(t, s.end - 0.45, 0.45)
  return fi * fo
}
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  background(t)
  for (const s of TIM.scenes) {
    if (t < s.start - 0.01 || t > s.end + 0.01) continue
    const a = sceneAlpha(s, t)
    // subtle push-in as each scene arrives
    const z = 1 + 0.03 * (1 - Po(t, s.start, 0.8))
    A(a, () => { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); SCENES[s.id](t) })
  }
  hud(t)
  vignette()
  // global fade from/to black
  const fb = Math.max(1 - P(t, 0, 0.6), P(t, TIM.total - 0.9, 0.9))
  if (fb > 0) { ctx.fillStyle = `rgba(0,0,0,${fb})`; ctx.fillRect(0, 0, W, H) }
}

async function loadFonts() {
  const nm = 'node_modules/@fontsource/'
  const list = [
    ['Inter', nm + 'inter/files/inter-latin-400-normal.woff2', '400'],
    ['Inter', nm + 'inter/files/inter-latin-500-normal.woff2', '500'],
    ['Inter', nm + 'inter/files/inter-latin-600-normal.woff2', '600'],
    ['Inter', nm + 'inter/files/inter-latin-700-normal.woff2', '700'],
    ['Inter', nm + 'inter/files/inter-latin-800-normal.woff2', '800'],
    ['JetBrains Mono', nm + 'jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2', '400'],
    ['JetBrains Mono', nm + 'jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2', '600'],
    ['JetBrains Mono', nm + 'jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2', '700'],
    ['Noto Sans Devanagari', nm + 'noto-sans-devanagari/files/noto-sans-devanagari-devanagari-400-normal.woff2', '400'],
  ]
  await Promise.all(list.map(async ([fam, url, weight]) => {
    const f = new FontFace(fam, `url(${url})`, { weight })
    await f.load(); document.fonts.add(f)
  }))
}

window.READY = (async () => {
  await loadFonts()
  plan()
  window.EV = EV.sort((a, b) => a.t - b.t)
  window.render = render
  const q = new URLSearchParams(location.search).get('t')
  render(q ? +q : 0)
  return true
})()
