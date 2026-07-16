import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Section, Block, Slider, ResultStrip, Callout } from './ui.jsx'
import { fmtUSD } from '../data.js'
import { loadEncoder, encodeToTokens, pseudoTokenize, noise } from '../tokenizer.js'

const Transformer3D = React.lazy(() => import('./Transformer3D.jsx'))

const CHIP_COLORS = ['#38d1e0', '#8b7cf7', '#f472b6', '#4ade80', '#fb923c', '#facc15']
const DEFAULT_TEXT = 'The robot picked up the ball because it was heavy.'

/* ------------------------------------------------------------------ */
/* Tokenization: real BPE once the vocabulary arrives                  */
/* ------------------------------------------------------------------ */
function useTokens(text) {
  const [enc, setEnc] = useState(null)
  useEffect(() => {
    let alive = true
    loadEncoder().then((e) => alive && setEnc(e)).catch(() => {})
    return () => { alive = false }
  }, [])
  return useMemo(() => {
    if (!text.trim()) return { real: !!enc, tokens: [] }
    if (!enc) return { real: false, tokens: pseudoTokenize(text) }
    return { real: true, tokens: encodeToTokens(enc, text) }
  }, [enc, text])
}

function TokChip({ text, i, dim, big }) {
  const c = CHIP_COLORS[i % CHIP_COLORS.length]
  return (
    <span
      className="token-chip"
      style={{
        background: c + (dim ? '14' : '30'),
        border: `1px solid ${c}${dim ? '30' : '77'}`,
        fontSize: big ? 15 : 13,
        opacity: dim ? 0.55 : 1,
      }}
    >
      {text.replace(/ /g, ' ')}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* The seven stages                                                    */
/* ------------------------------------------------------------------ */
const STAGES = [
  { key: 'context', label: 'Context in', title: '1 · Everything starts with the context',
    desc: 'The model never sees just your message. The system prompt, conversation history, retrieved documents and tool outputs are concatenated with it into one long sequence — the context window. This whole sequence is the input, every single turn, and every part of it is billed.' },
  { key: 'tokenize', label: 'Tokenize', title: '2 · Your text becomes token IDs',
    desc: 'A tokenizer splits the text into subword units and maps each to an integer ID from a fixed vocabulary (~100K entries here). Common words are one token; rare words split into pieces. From here on, the model only ever sees numbers — and this is exactly the unit on your invoice.' },
  { key: 'embed', label: 'Embed', title: '3 · Token IDs become vectors',
    desc: 'Each ID looks up a learned embedding — a vector of thousands of numbers (e.g. 8,192 dimensions) encoding the token’s meaning as geometry: "cat" and "kitten" end up near each other. Position information is mixed in so the model knows word order. These vectors are what actually flow through the network.' },
  { key: 'layers', label: 'Layers · 3D', title: '4 · Through the transformer stack — in 3D',
    desc: 'Your tokens now rise together through a deep stack of identical layers (~80 in a 70B-class model; 10 shown). In each layer, attention lets the tokens exchange information (pink flashes), then a feed-forward network transforms each one. At the top, a prediction (green) emerges — and loops straight back to the bottom as the next input token. Drag to orbit.' },
  { key: 'attention', label: 'Attention', title: '5 · Attention: every token looks back',
    desc: 'Inside each layer, every token computes a query and compares it against the keys of all previous tokens. The match scores become weights, and the token pulls in a weighted blend of their values — meaning flows between positions. Click any of your tokens to make it the query.' },
  { key: 'predict', label: 'Predict', title: '6 · One probability for every token in the vocabulary',
    desc: 'After the final layer, the last token’s vector is projected onto the whole vocabulary and squashed into a probability distribution (softmax). The model doesn’t "know" the next word — it scores every candidate, and a sampler picks one.' },
  { key: 'loop', label: 'Loop & stream', title: '7 · The chosen token is fed straight back in',
    desc: 'The sampled token is appended to your sequence and the entire process repeats — one full pass through all the layers, reading all the weights, per token. This autoregressive loop is what you see as a stream of tokens in a chat window, and it is why output tokens cost more than input tokens (Module 02).' },
]

/* Stage 1 — context assembly, with the user's real text */
function StageContext({ text, nTok }) {
  const [merged, setMerged] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMerged(true), 600); return () => clearTimeout(t) }, [])
  const preview = text.length > 60 ? text.slice(0, 57) + '…' : text
  const parts = [
    { name: 'System prompt', ex: '“You are a helpful assistant…”', color: 'var(--accent-violet)', tok: '~1,200 tokens' },
    { name: 'Conversation history', ex: 'every earlier turn', color: 'var(--accent-cyan)', tok: '~2,400 tokens' },
    { name: 'Retrieved docs / tool output', ex: 'RAG passages, file contents', color: 'var(--accent-orange)', tok: '~3,000 tokens' },
    { name: 'Your message', ex: `“${preview}”`, color: 'var(--accent-pink)', tok: `${nTok} token${nTok === 1 ? '' : 's'}` },
  ]
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {parts.map((p, i) => (
          <div key={p.name} className="card" style={{
            flex: '1 1 160px', padding: 14, borderColor: p.color + '66',
            transform: merged ? 'translateY(0)' : `translateY(${-8 - i * 4}px)`,
            opacity: merged ? 1 : 0.4, transition: `all 0.6s ${i * 0.12}s cubic-bezier(0.2,0.8,0.2,1)`,
          }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: p.color }}>{p.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-dim)', margin: '4px 0', wordBreak: 'break-word' }}>{p.ex}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-faint)' }}>{p.tok}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', margin: '14px 0', color: 'var(--text-faint)' }}>↓ concatenated into one sequence ↓</div>
      <div style={{
        display: 'flex', height: 34, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-bright)',
        opacity: merged ? 1 : 0, transition: 'opacity 0.6s 0.5s',
      }}>
        <div style={{ width: '18%', background: 'rgba(139,124,247,0.5)' }} />
        <div style={{ width: '36%', background: 'rgba(56,209,224,0.45)' }} />
        <div style={{ width: '42%', background: 'rgba(251,146,60,0.45)' }} />
        <div style={{ width: '4%', background: 'rgba(244,114,182,0.6)' }} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>
        The context window — ~6,600 tokens here. Your actual message is the thin pink sliver: in
        enterprise workloads most billed input is scaffolding, which is why context engineering
        (Module 07) is such a big lever.
      </div>
    </div>
  )
}

/* Stage 2 — real BPE split of the user's text */
function StageTokenize({ tokens, real, text }) {
  const chars = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const MAX_CHIPS = 48
  const MAX_IDS = 12
  const shown = tokens.slice(0, MAX_CHIPS)
  return (
    <div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {shown.map((t, i) => (
          <div key={i} style={{ textAlign: 'center', animation: `tokenIn 0.3s ${Math.min(i * 0.05, 1.5)}s both` }}>
            <TokChip text={t.text} i={i} big={tokens.length <= 16} />
            {i < MAX_IDS && (
              <>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--accent-cyan)', marginTop: 5 }}>{t.id}</div>
                <div style={{ fontSize: 9.5, color: 'var(--text-faint)' }}>token ID</div>
              </>
            )}
          </div>
        ))}
        {tokens.length > MAX_CHIPS && (
          <span style={{ fontSize: 12, color: 'var(--text-faint)', alignSelf: 'center' }}>
            +{tokens.length - MAX_CHIPS} more tokens
          </span>
        )}
      </div>
      <ResultStrip items={[
        { label: 'Tokens', value: tokens.length },
        { label: 'Characters', value: chars, note: `${(chars / Math.max(1, tokens.length)).toFixed(1)} chars / token` },
        { label: 'Words', value: words, note: `${(tokens.length / Math.max(1, words)).toFixed(2)} tokens / word` },
        { label: 'As input @ $3/M', value: fmtUSD((tokens.length / 1e6) * 3, 6), note: 'one request — pennies; billions add up' },
      ]} />
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 12 }}>
        {real
          ? <>These are <strong style={{ color: 'var(--text)' }}>real BPE tokens</strong> (the cl100k_base vocabulary used by GPT-4-class models), computed live in your browser — real IDs, real boundaries.</>
          : <>Loading the real BPE vocabulary (~1.6MB)… showing an approximate split meanwhile.</>}{' '}
        Rule of thumb: 1 token ≈ 4 characters ≈ ¾ of an English word. Vocabulary design matters
        commercially — the same sentence can be ~20% more tokens in one model family than another,
        silently changing the bill. Try pasting numbers, code or another language above.
      </div>
    </div>
  )
}

/* Stage 3 — embeddings for the user's first tokens */
const heat = (v) => (v < 0.5
  ? `rgba(56, 209, 224, ${0.15 + (0.5 - v) * 1.5})`
  : `rgba(244, 114, 182, ${0.15 + (v - 0.5) * 1.5})`)

function StageEmbed({ tokens }) {
  const DIMS = 7
  const shown = tokens.slice(0, 8)
  return (
    <div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {shown.map((t, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <TokChip text={t.text} i={i} />
            <div style={{ color: 'var(--text-faint)', fontSize: 11, margin: '4px 0' }}>↓</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Array.from({ length: DIMS }).map((_, k) => (
                <div key={k} style={{
                  width: 46, height: 13, borderRadius: 3, background: heat(noise(t.id, k)),
                  animation: `tokenIn 0.4s ${i * 0.12 + k * 0.05}s both`,
                }} />
              ))}
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-faint)', marginTop: 3 }}>⋮ ×8,192</div>
            </div>
          </div>
        ))}
        {tokens.length > 8 && (
          <div style={{ alignSelf: 'center', fontSize: 12, color: 'var(--text-faint)' }}>+{tokens.length - 8} more</div>
        )}
        <div style={{ flex: '1 1 220px', fontSize: 12.5, color: 'var(--text-dim)', alignSelf: 'center', minWidth: 200 }}>
          Each column is one of your tokens as a vector — thousands of numbers, learned during
          training, that place the token in a geometric “meaning space”. Everything the model does
          from here is matrix arithmetic on these columns. (Cell colours are illustrative,
          deterministically derived from each real token ID.)
          <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-faint)' }}>
            + a positional signal, so “cat sat on mat” ≠ “mat sat on cat”.
          </div>
        </div>
      </div>
    </div>
  )
}

/* Stage 4 — the 3D transformer stack */
const STATUS_TEXT = {
  embed: 'Your token vectors enter at the bottom of the stack…',
  layers: 'Rising through the layers — attention (pink flashes) mixes information between your tokens, then feed-forward networks transform each one.',
  predict: 'Top of the stack: the next-token prediction (green) emerges — and is fed back to the bottom to start the next pass.',
}

function StageLayers({ tokens }) {
  const [status, setStatus] = useState('embed')
  return (
    <div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 420px', minWidth: 300, border: '1px solid var(--border)', borderRadius: 12, background: 'radial-gradient(ellipse at 50% 40%, rgba(139,124,247,0.07), transparent 70%)' }}>
          <Suspense fallback={
            <div style={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
              Loading the 3D transformer…
            </div>
          }>
            <Transformer3D tokenCount={Math.min(10, Math.max(2, tokens.length))} onStatus={setStatus} />
          </Suspense>
          <div style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--text-dim)', borderTop: '1px solid var(--border)', minHeight: 56 }}>
            {STATUS_TEXT[status]}
            <span style={{ display: 'block', fontSize: 11, color: 'var(--text-faint)', marginTop: 3 }}>
              🖱 drag to orbit · {Math.min(10, Math.max(2, tokens.length))} of your tokens shown as spheres
            </span>
          </div>
        </div>
        <div style={{ flex: '1 1 240px', minWidth: 240 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)', marginBottom: 10 }}>
              Where 70B parameters live
            </div>
            {[
              ['Embedding matrix', '~1B', 'var(--accent-yellow)'],
              ['Attention weights (Q, K, V, O) × 80 layers', '~22B', 'var(--accent-violet)'],
              ['Feed-forward weights × 80 layers', '~45B', 'var(--accent-cyan)'],
              ['Output projection', '~1B', 'var(--accent-pink)'],
            ].map(([name, n, c]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-dim)' }}>{name}</span>
                <span style={{ fontFamily: 'var(--mono)', color: c, flexShrink: 0 }}>{n}</span>
              </div>
            ))}
            <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 10 }}>
              All ~140 GB of these numbers (at 16-bit) are read from GPU memory{' '}
              <strong style={{ color: 'var(--text)' }}>for every single token generated</strong> —
              the physical root of the economics in Modules 02 and 05.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Stage 5 — attention over the user's own tokens */
const STOPWORDS = new Set(['the', 'a', 'an', 'is', 'was', 'are', 'were', 'on', 'in', 'of', 'and', 'or',
  'to', 'up', 'at', 'it', 'its', 'because', 'that', 'this', 'with', 'from', 'have', 'has', 'be', 'as', 'by'])

function attnWeights(tokens, sel) {
  const w = new Array(tokens.length).fill(0)
  if (sel <= 0) return w
  const qText = tokens[sel].text.trim().toLowerCase()
  // pronouns attend strongly to the nearest earlier content word (coreference-style)
  let corefTarget = -1
  if (qText === 'it' || qText === 'they' || qText === 'he' || qText === 'she' || qText === 'this') {
    for (let j = sel - 1; j >= 0; j--) {
      const t = tokens[j].text.trim().toLowerCase()
      if (t.length >= 4 && !STOPWORDS.has(t) && /^[a-z]/.test(t)) { corefTarget = j; break }
    }
  }
  let sum = 0
  for (let j = 0; j < sel; j++) {
    const jText = tokens[j].text.trim().toLowerCase()
    let v = Math.exp(-(sel - j) * 0.32) * (0.5 + 1.5 * noise(tokens[sel].id, tokens[j].id))
    if (jText === qText && jText) v *= 3 // repeated word
    if (j === corefTarget) v *= 5
    if (STOPWORDS.has(jText)) v *= 0.55
    w[j] = v
    sum += v
  }
  for (let j = 0; j < sel; j++) w[j] /= sum
  return w
}

function StageAttention({ tokens }) {
  const view = tokens.slice(0, 12)
  const [sel, setSel] = useState(-1)
  // default query: "it" if present (the classic coreference case), else the last word
  const auto = useMemo(() => {
    const it = view.findIndex((t, i) => i > 0 && t.text.trim().toLowerCase() === 'it')
    if (it > 0) return it
    for (let i = view.length - 1; i > 0; i--) if (/\w/.test(view[i].text)) return i
    return view.length - 1
  }, [view])
  const q = sel >= 0 && sel < view.length ? sel : auto
  const w = useMemo(() => attnWeights(view, q), [view, q])

  if (view.length < 3) {
    return <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>Type at least a few words above to explore attention between your tokens.</div>
  }

  const W = 700, H = 210
  const xs = view.map((_, i) => 45 + i * ((W - 90) / Math.max(1, view.length - 1)))
  const boxW = Math.min(64, (W - 90) / view.length + 14)
  const label = (t) => {
    const s = t.text.trim() || '␣'
    return s.length > 7 ? s.slice(0, 6) + '…' : s
  }
  const qText = view[q].text.trim().toLowerCase()
  const top = w.indexOf(Math.max(...w.slice(0, q).concat([0])))

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {view.map((_, j) => {
          if (j >= q || w[j] < 0.02) return null
          const midX = (xs[j] + xs[q]) / 2
          const arc = 35 + (1 - w[j]) * 85
          return (
            <path key={j}
              d={`M ${xs[q]} ${H - 66} Q ${midX} ${arc} ${xs[j]} ${H - 66}`}
              fill="none" stroke="var(--accent-violet)"
              strokeWidth={0.8 + w[j] * 11} opacity={0.2 + w[j] * 1.1} strokeLinecap="round"
              style={{ transition: 'all 0.4s' }}
            />
          )
        })}
        {view.map((t, i) => (
          <g key={i} onClick={() => setSel(i)} style={{ cursor: 'pointer' }}>
            <rect x={xs[i] - boxW / 2} y={H - 64} width={boxW} height={26} rx={6}
              fill={i === q ? 'rgba(244,114,182,0.3)' : i < q && w[i] > 0.15 ? 'rgba(139,124,247,0.25)' : 'rgba(21,26,40,1)'}
              stroke={i === q ? 'var(--accent-pink)' : i < q && w[i] > 0.15 ? 'var(--accent-violet)' : 'var(--border)'}
              style={{ transition: 'all 0.3s' }} />
            <text x={xs[i]} y={H - 46} textAnchor="middle" fill={i > q ? 'var(--text-faint)' : 'var(--text)'} fontSize="11.5" fontFamily="var(--mono)">
              {label(t)}
            </text>
            <text x={xs[i]} y={H - 18} textAnchor="middle" fontSize="10.5" fontFamily="var(--mono)"
              fill={i === q ? 'var(--accent-pink)' : w[i] > 0.02 && i < q ? 'var(--accent-violet)' : 'transparent'}>
              {i === q ? '◄ query' : `${Math.round(w[i] * 100)}%`}
            </text>
          </g>
        ))}
      </svg>
      <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
        Query: <strong style={{ color: 'var(--accent-pink)' }}>“{view[q].text.trim() || '␣'}”</strong>
        {qText === 'it' && top >= 0
          ? <> — and attention resolves the pronoun: its strongest link is to{' '}
            <strong style={{ color: 'var(--accent-violet)' }}>“{view[top].text.trim()}”</strong>. In a real model no rule
            is programmed for this; the weights learn it from data.</>
          : <> — attention can only look backwards (earlier tokens), which is what makes the model causal.
            {view.some((t) => t.text.trim().toLowerCase() === 'it') ? ' Click “it” for the classic pronoun-resolution case.' : ' Try a sentence with “it” referring to something earlier.'}</>}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
        {tokens.length > 12 ? `Showing your first 12 tokens. ` : ''}This is one attention head — a 70B-class
        model runs ~64 heads × 80 layers = 5,120 of these pattern-matchers in parallel per token.
        Weights here are illustrative, derived from your real token IDs.
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Stages 6 & 7 — prediction + autoregressive loop (shared grammar)    */
/* ------------------------------------------------------------------ */
const GRAMMAR = {
  start: { opts: [['the', 32], ['a', 18], ['it', 18], ['this', 15], ['every', 17]], next: (w) => (w === 'it' ? 'verb' : 'subj') },
  subj: { opts: [['model', 24], ['network', 16], ['sampler', 15], ['sequence', 15], ['pattern', 15], ['token', 15]], next: () => 'verb' },
  verb: { opts: [['predicts', 22], ['generates', 21], ['samples', 20], ['learns', 19], ['streams', 18]], next: () => 'objdet' },
  objdet: { opts: [['the', 42], ['a', 26], ['one', 16], ['its', 16]], next: () => 'obj' },
  obj: { opts: [['next', 30], ['distribution', 22], ['context', 26], ['output', 22]], next: (w) => (w === 'next' ? 'obj2' : 'end') },
  obj2: { opts: [['token', 64], ['word', 36]], next: () => 'end' },
  end: { opts: [['.', 50], [',', 28], ['and', 22]], next: (w) => (w === '.' ? 'stop' : w === ',' ? 'conj' : 'verb') },
  conj: { opts: [['then', 38], ['and', 36], ['so', 26]], next: () => 'pron' },
  pron: { opts: [['it', 58], ['the', 42]], next: (w) => (w === 'it' ? 'verb' : 'subj') },
}

function distribution(state, seed, temp) {
  const { opts } = GRAMMAR[state]
  const jittered = opts.map(([t, p], i) => [t, p * (0.6 + 0.8 * noise(seed, i))])
  const powed = jittered.map(([t, p]) => [t, Math.pow(p, 1 / temp)])
  const sum = powed.reduce((a, [, p]) => a + p, 0)
  return powed.map(([t, p]) => [t, p / sum]).sort((a, b) => b[1] - a[1])
}

function StagePredict({ tokens }) {
  const [picked, setPicked] = useState(false)
  useEffect(() => { const t = setTimeout(() => setPicked(true), 1600); return () => clearTimeout(t) }, [])
  const seed = tokens.length ? tokens[tokens.length - 1].id : 1
  const dist = useMemo(() => distribution('start', seed, 1), [seed])
  const tail = tokens.slice(-6)
  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 13.5, color: 'var(--text-dim)', marginBottom: 14 }}>
        “…{tail.map((t) => t.text).join('')}<span style={{ color: 'var(--accent-pink)' }}> ▁?</span>”
      </div>
      {dist.map(([t, p], i) => (
        <div className="bar-row" key={t}>
          <div className="bar-label" style={{ width: 120, fontFamily: 'var(--mono)' }}>{t.trim()}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{
              width: `${p * 160}%`,
              background: i === 0 && picked ? 'var(--accent-green)' : 'var(--accent-violet)',
              boxShadow: i === 0 && picked ? '0 0 12px rgba(74,222,128,0.5)' : 'none',
            }}>
              <span className="bar-value">{(p * 100).toFixed(0)}%{i === 0 && picked ? '  ← sampled' : ''}</span>
            </div>
          </div>
        </div>
      ))}
      <div className="bar-row">
        <div className="bar-label" style={{ width: 120, fontFamily: 'var(--mono)', color: 'var(--text-faint)' }}>…100K more</div>
        <div className="bar-track">
          <div className="bar-fill" style={{ width: '3%', background: 'var(--border-bright)' }} />
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 10 }}>
        One probability per vocabulary entry, recomputed for every token. (Candidates here are
        scripted for illustration — no model runs in your browser — but they are seeded from your
        real last token ID.) Reasoning models make this step deliberate: thousands of hidden
        “thinking” tokens before the visible answer, all billed at the output rate.
      </div>
    </div>
  )
}

function StageLoop({ tokens }) {
  const [temp, setTemp] = useState(0.8)
  const [gen, setGen] = useState([]) // [{word, state}]
  const [auto, setAuto] = useState(false)
  const [flash, setFlash] = useState(-1)

  const state = gen.length === 0 ? 'start' : gen[gen.length - 1].nextState
  const done = state === 'stop' || gen.length >= 14
  const seed = (tokens.length ? tokens[tokens.length - 1].id : 1) + gen.length * 131
  const dist = useMemo(() => distribution(done ? 'start' : state, seed, temp), [state, seed, temp, done])

  const step = (mode) => {
    if (done) return
    let choice
    if (mode === 'greedy') choice = dist[0][0]
    else {
      let r = Math.random(), acc = 0
      choice = dist[dist.length - 1][0]
      for (const [t, p] of dist) { acc += p; if (r <= acc) { choice = t; break } }
    }
    setGen((g) => [...g, { word: choice, nextState: GRAMMAR[done ? 'start' : state].next(choice) }])
    setFlash(gen.length)
    setTimeout(() => setFlash(-1), 500)
  }

  useEffect(() => {
    if (!auto || done) { if (done) setAuto(false); return }
    const t = setTimeout(() => step('sample'), 650)
    return () => clearTimeout(t)
  }, [auto, gen, done]) // eslint-disable-line react-hooks/exhaustive-deps

  const userTail = tokens.slice(-10)

  return (
    <div>
      <div className="grid grid-2" style={{ gap: 28 }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Your sequence, streaming
          </div>
          <div style={{ lineHeight: 2.2, minHeight: 90 }}>
            {tokens.length > 10 && <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>… </span>}
            {userTail.map((t, i) => <TokChip key={i} text={t.text} i={i} dim />)}
            {gen.map((g, i) => (
              <span key={i} className="token-chip" style={{
                background: i === flash ? 'rgba(74,222,128,0.45)' : 'rgba(74,222,128,0.2)',
                border: '1px solid rgba(74,222,128,0.6)', fontWeight: 600, transition: 'background 0.4s',
              }}>{/^[.,]/.test(g.word) ? g.word : ' ' + g.word}</span>
            ))}
            {!done && <span style={{ color: 'var(--accent-cyan)' }}>▊</span>}
            {done && <span style={{ color: 'var(--accent-green)', fontSize: 11, marginLeft: 10 }}>■ stop — generation ends</span>}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            <button className="btn primary" disabled={done} onClick={() => step('sample')}>🎲 Sample next token</button>
            <button className="btn" disabled={done} onClick={() => setAuto(!auto)}>{auto ? '⏸ Pause stream' : '▶ Stream'}</button>
            <button className="btn" disabled={done} onClick={() => step('greedy')}>Greedy (always top)</button>
            <button className="btn" onClick={() => { setGen([]); setAuto(false) }}>↺ Reset</button>
          </div>
          <div style={{ marginTop: 18 }}>
            <Slider label="Temperature — how adventurous the sampler is" value={temp} min={0.1} max={2} step={0.1}
              display={temp.toFixed(1) + (temp < 0.4 ? ' · near-deterministic' : temp > 1.3 ? ' · chaotic' : ' · balanced')}
              onChange={setTemp} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Distribution for the next token
          </div>
          {done ? (
            <div style={{ fontSize: 13, color: 'var(--text-dim)', padding: '20px 0' }}>
              Generation complete: <strong style={{ color: 'var(--text)' }}>{gen.length} output tokens = {gen.length} full
              forward passes</strong>, each reading ~140 GB of weights. Your whole input was one parallel pass.
              Hit Reset and try a different temperature — low repeats itself, high surprises.
            </div>
          ) : dist.map(([t, p], i) => (
            <div className="bar-row" key={t}>
              <div className="bar-label" style={{ width: 110, fontFamily: 'var(--mono)' }}>{t.trim()}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${p * 100}%`, background: i === 0 ? 'var(--accent-cyan)' : 'var(--accent-violet)' }}>
                  <span className="bar-value">{(p * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
          {!done && (
            <ResultStrip items={[
              { label: 'Forward passes so far', value: gen.length, note: 'one per output token' },
              { label: 'Temperature', value: temp.toFixed(1) },
            ]} />
          )}
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 10 }}>
            Temperature reshapes the same underlying scores: T→0 concentrates all probability on the
            top token; high T flattens the field. Scripted toy distributions for illustration.
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* The walkthrough shell                                               */
/* ------------------------------------------------------------------ */
function Walkthrough({ text, tokens, real }) {
  const [stage, setStage] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      setStage((s) => {
        if (s >= STAGES.length - 1) { setPlaying(false); return s }
        return s + 1
      })
    }, 6500)
    return () => clearTimeout(t)
  }, [playing, stage])

  const s = STAGES[stage]

  return (
    <div className="panel">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {STAGES.map((st, i) => (
          <button
            key={st.key}
            onClick={() => { setStage(i); setPlaying(false) }}
            className="btn"
            style={{
              padding: '5px 12px', fontSize: 12,
              borderColor: i === stage ? 'var(--accent-cyan)' : i < stage ? 'var(--accent-green)' : undefined,
              color: i === stage ? 'var(--accent-cyan)' : i < stage ? 'var(--accent-green)' : undefined,
              background: i === stage ? 'rgba(56,209,224,0.1)' : undefined,
            }}
          >
            {i + 1} · {st.label}
          </button>
        ))}
      </div>

      <div style={{ minHeight: 340 }}>
        <div style={{ fontWeight: 700, fontSize: 16.5, marginBottom: 6 }}>{s.title}</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-dim)', maxWidth: 780, marginBottom: 22 }}>{s.desc}</div>

        {tokens.length === 0 ? (
          <div style={{ fontSize: 13.5, color: 'var(--text-dim)', padding: '30px 0' }}>
            Type something in the box above to begin — your text drives every stage.
          </div>
        ) : (
          <>
            {s.key === 'context' && <StageContext text={text} nTok={tokens.length} />}
            {s.key === 'tokenize' && <StageTokenize tokens={tokens} real={real} text={text} />}
            {s.key === 'embed' && <StageEmbed tokens={tokens} />}
            {s.key === 'layers' && <StageLayers tokens={tokens} />}
            {s.key === 'attention' && <StageAttention tokens={tokens} />}
            {s.key === 'predict' && <StagePredict tokens={tokens} />}
            {s.key === 'loop' && <StageLoop tokens={tokens} />}
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn" disabled={stage === 0} onClick={() => { setStage(stage - 1); setPlaying(false) }}>← Back</button>
        <button className="btn primary" disabled={stage === STAGES.length - 1} onClick={() => { setStage(stage + 1); setPlaying(false) }}>
          Next stage →
        </button>
        <button className="btn" onClick={() => { if (!playing && stage === STAGES.length - 1) setStage(0); setPlaying(!playing) }}>
          {playing ? '⏸ Pause' : '▶ Auto-play all'}
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>Stage {stage + 1} of {STAGES.length}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
export default function InsideLLM() {
  const [text, setText] = useState(DEFAULT_TEXT)
  const { tokens, real } = useTokens(text)

  return (
    <Section
      id="llm"
      kicker="Module 01 · Inside the model"
      title="How an LLM works — with your own words"
      lede={
        <>
          An LLM does exactly one thing: given a sequence of tokens, it predicts a probability for{' '}
          <strong>every possible next token</strong> — then the chosen one is fed back in and it does
          it again. Type anything below, then walk your own text through all seven stages of that
          loop: tokens → embeddings → the 3D transformer stack → attention → prediction → the stream.
        </>
      }
    >
      <Block title="Start here: type anything" sub="Your text drives every stage below — tokenized live with a real BPE vocabulary.">
        <div className="panel" style={{ paddingBottom: 16 }}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2000))}
            rows={2}
            style={{
              width: '100%', background: 'var(--bg)', color: 'var(--text)',
              border: '1px solid var(--border-bright)', borderRadius: 10, padding: 14,
              fontFamily: 'var(--sans)', fontSize: 14.5, resize: 'vertical', outline: 'none',
            }}
            placeholder="Type anything — a question, code, another language…"
          />
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>
            {tokens.length > 0
              ? <><strong style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--mono)' }}>{tokens.length}</strong> tokens
                {real ? ' · real cl100k BPE, computed in your browser' : ' · loading real tokenizer, approximate split shown'} · try “The robot picked up the ball because it was heavy.” for the attention demo</>
              : 'Waiting for input…'}
          </div>
        </div>
      </Block>

      <Block title="The token factory — step through the machine" sub="Seven stages from your keystrokes to a streaming answer. Use Next, or Auto-play all.">
        <Walkthrough text={text} tokens={tokens} real={real} />
      </Block>

      <Callout tone="pink" title="Why this machine shapes every price in this guide">
        Three consequences fall straight out of the architecture. <strong>Generation is
        sequential</strong> — one full pass through all ~80 layers, reading every weight, per output
        token. <strong>Attention needs every previous token’s state</strong> — kept in GPU memory as
        the KV cache, which is why long context is surcharged and cached prefixes get ~90% off.
        And <strong>parameters are read from memory each token</strong> — so model size × precision
        sets a hard physical floor under every price. Module 02 turns these three facts into the
        prefill/decode split on your invoice; Module 05 builds the full cost model.
      </Callout>
    </Section>
  )
}
