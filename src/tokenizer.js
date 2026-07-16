// Real BPE tokenization (OpenAI cl100k_base via js-tiktoken), lazy-loaded so the
// ~1.6MB vocabulary never blocks initial page load. While it downloads, a
// heuristic splitter stands in so the UI is interactive immediately.

let encoderPromise = null

export function loadEncoder() {
  if (!encoderPromise) {
    encoderPromise = Promise.all([
      import('js-tiktoken/lite'),
      import('js-tiktoken/ranks/cl100k_base'),
    ]).then(([{ Tiktoken }, ranks]) => new Tiktoken(ranks.default))
  }
  return encoderPromise
}

// Deterministic small hash → stable pseudo token IDs / jitter everywhere.
export function hashStr(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

// 0..1 deterministic noise from two integers
export function noise(a, b) {
  const v = Math.sin((a + 1) * 37.7 + (b + 1) * 91.3) * 43758.5453
  return v - Math.floor(v)
}

// Fallback splitter: common short words = 1 token, long words split into chunks.
export function pseudoTokenize(text) {
  const out = []
  const parts = text.split(/(\s+)/)
  let pendingWs = ''
  for (const part of parts) {
    if (!part) continue
    if (/^\s+$/.test(part)) { pendingWs = part; continue }
    const pieces = part.match(/[A-Za-z0-9]+|[^A-Za-z0-9]+/g) || [part]
    pieces.forEach((p, pi) => {
      const prefix = pi === 0 ? pendingWs : ''
      if (p.length <= 4 || /^[^A-Za-z0-9]+$/.test(p)) {
        out.push({ text: prefix + p, id: hashStr(prefix + p) % 100000 })
      } else {
        let i = 0
        while (i < p.length) {
          const size = i === 0 ? Math.min(4, p.length) : Math.min(3 + ((i * 7) % 3), p.length - i)
          const chunk = p.slice(i, i + size)
          out.push({ text: (i === 0 ? prefix : '') + chunk, id: hashStr(chunk) % 100000 })
          i += size
        }
      }
    })
    pendingWs = ''
  }
  return out
}

export function encodeToTokens(enc, text) {
  const ids = enc.encode(text)
  return ids.map((id) => ({ id, text: enc.decode([id]) }))
}
