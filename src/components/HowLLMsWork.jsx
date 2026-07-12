import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Section, Block, Slider, ResultStrip, Callout } from './ui.jsx'

/* ------------------------------------------------------------------ */
/* Shared example: "The cat sat on the" → predicting " mat"            */
/* ------------------------------------------------------------------ */
const PROMPT = [
  { t: 'The', id: 464 },
  { t: ' cat', id: 2415 },
  { t: ' sat', id: 7731 },
  { t: ' on', id: 389 },
  { t: ' the', id: 262 },
]
const CHIP_COLORS = ['#38d1e0', '#8b7cf7', '#f472b6', '#4ade80', '#fb923c', '#facc15']

function TokChip({ text, i, dim, big }) {
  return (
    <span
      className="token-chip"
      style={{
        background: CHIP_COLORS[i % CHIP_COLORS.length] + (dim ? '14' : '30'),
        border: `1px solid ${CHIP_COLORS[i % CHIP_COLORS.length]}${dim ? '30' : '77'}`,
        fontSize: big ? 15 : 13,
        opacity: dim ? 0.55 : 1,
      }}
    >
      {text}
    </span>
  )
}

/* deterministic pseudo-random for embedding heat cells */
const cellVal = (tok, k) => {
  const h = Math.sin((tok + 1) * 37.7 + k * 91.3) * 43758.5453
  return h - Math.floor(h)
}
const heat = (v) => {
  // -1..1 style diverging: cyan → dark → pink
  if (v < 0.5) return `rgba(56, 209, 224, ${0.15 + (0.5 - v) * 1.5})`
  return `rgba(244, 114, 182, ${0.15 + (v - 0.5) * 1.5})`
}

/* ------------------------------------------------------------------ */
/* THE WALKTHROUGH — 7 animated stages                                 */
/* ------------------------------------------------------------------ */
const STAGES = [
  { key: 'context', label: 'Context in', title: '1 · Everything starts with the context',
    desc: 'The model never sees just your last message. The system prompt, the conversation history, retrieved documents and tool outputs are concatenated into one long sequence — the context window. This whole sequence is the input, every single turn.' },
  { key: 'tokenize', label: 'Tokenize', title: '2 · Text becomes token IDs',
    desc: 'A tokenizer splits the text into subword units and maps each to an integer ID from a fixed vocabulary (typically 32K–256K entries). From here on, the model only ever sees numbers.' },
  { key: 'embed', label: 'Embed', title: '3 · Token IDs become vectors',
    desc: 'Each ID looks up a learned embedding — a vector of thousands of numbers (e.g. 8,192 dimensions) that encodes the token’s meaning as geometry: "cat" and "kitten" end up near each other. Position information is mixed in so the model knows word order. These vectors are what actually flow through the network.' },
  { key: 'layers', label: 'Layers', title: '4 · Through a stack of transformer layers',
    desc: 'The vectors pass through a deep stack of identical layers — ~80 in a 70B-class model. Each layer has two parts: attention (tokens exchange information) and a feed-forward network (each token is transformed independently). The "70 billion parameters" are the learned numbers inside these layers’ matrices — and every one of them is read from memory for every token generated.' },
  { key: 'attention', label: 'Attention', title: '5 · Attention: every token looks back',
    desc: 'Inside each layer, every token computes a query and compares it against the keys of all previous tokens. The match scores become weights, and the token pulls in a weighted blend of their values. This is how " the" learns it’s about a cat on something — meaning flows between positions. Dozens of heads per layer each learn different relationships.' },
  { key: 'predict', label: 'Predict', title: '6 · One probability for every word in the vocabulary',
    desc: 'After the final layer, the last token’s vector is projected onto the whole vocabulary and squashed into a probability distribution (softmax). The model doesn’t "know" the next word — it scores every candidate. A sampler then picks one: greedily, or with randomness (temperature).' },
  { key: 'loop', label: 'Loop', title: '7 · The chosen token is fed straight back in',
    desc: 'The sampled token is appended to the sequence, and the entire process repeats to produce the token after it — one full pass through all the layers, reading all the weights, per token. This autoregressive loop is why generation is sequential, why output tokens cost 3–8× input tokens, and why the KV cache exists: previous tokens’ attention state is kept in GPU memory so only the new token needs processing.' },
]

function LLMWalkthrough() {
  const [stage, setStage] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (playing) {
      timer.current = setTimeout(() => {
        setStage((s) => {
          if (s >= STAGES.length - 1) { setPlaying(false); return s }
          return s + 1
        })
      }, 5200)
    }
    return () => clearTimeout(timer.current)
  }, [playing, stage])

  const s = STAGES[stage]

  return (
    <div className="panel">
      {/* stage pills */}
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

      <div style={{ minHeight: 330 }}>
        <div style={{ fontWeight: 700, fontSize: 16.5, marginBottom: 6 }}>{s.title}</div>
        <div style={{ fontSize: 13.5, color: 'var(--text-dim)', maxWidth: 780, marginBottom: 22 }}>{s.desc}</div>

        {s.key === 'context' && <StageContext />}
        {s.key === 'tokenize' && <StageTokenize />}
        {s.key === 'embed' && <StageEmbed />}
        {s.key === 'layers' && <StageLayers />}
        {s.key === 'attention' && <StageAttention />}
        {s.key === 'predict' && <StagePredict />}
        {s.key === 'loop' && <StageLoop />}
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

function StageContext() {
  const [merged, setMerged] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMerged(true), 700); return () => clearTimeout(t) }, [])
  const parts = [
    { name: 'System prompt', ex: '“You are a helpful assistant…”', color: 'var(--accent-violet)', tok: '~1,200 tokens' },
    { name: 'Conversation history', ex: 'every earlier turn', color: 'var(--accent-cyan)', tok: '~2,400 tokens' },
    { name: 'Retrieved docs / tool output', ex: 'RAG passages, file contents', color: 'var(--accent-orange)', tok: '~3,000 tokens' },
    { name: 'Your new message', ex: '“The cat sat on the…”', color: 'var(--accent-pink)', tok: '~10 tokens' },
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
            <div style={{ fontSize: 11.5, color: 'var(--text-dim)', margin: '4px 0' }}>{p.ex}</div>
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
        The context window — ~6,600 tokens here. Notice your actual question is the thin pink sliver:
        in enterprise workloads most billed input is scaffolding, which is why context engineering
        (Module 07) is such a big lever.
      </div>
    </div>
  )
}

function StageTokenize() {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setShown((n) => (n >= PROMPT.length ? n : n + 1)), 350)
    return () => clearInterval(iv)
  }, [])
  return (
    <div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 15, marginBottom: 18, color: 'var(--text-dim)' }}>
        “The cat sat on the”
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {PROMPT.map((p, i) => (
          <div key={i} style={{
            textAlign: 'center', opacity: i < shown ? 1 : 0.12,
            transform: i < shown ? 'none' : 'translateY(6px)', transition: 'all 0.35s',
          }}>
            <TokChip text={p.t} i={i} big />
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent-cyan)', marginTop: 6 }}>
              {p.id}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>token ID</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 20 }}>
        The vocabulary is fixed at training time. Common words are single tokens; rare words split
        into pieces (“tokenomics” → “token” + “omics”). This is the unit on your invoice.
      </div>
    </div>
  )
}

function StageEmbed() {
  const DIMS = 7
  return (
    <div>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        {PROMPT.map((p, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <TokChip text={p.t} i={i} />
            <div style={{ color: 'var(--text-faint)', fontSize: 11, margin: '4px 0' }}>↓</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {Array.from({ length: DIMS }).map((_, k) => (
                <div key={k} style={{
                  width: 46, height: 13, borderRadius: 3, background: heat(cellVal(p.id, k)),
                  animation: `tokenIn 0.4s ${i * 0.12 + k * 0.05}s both`,
                }} />
              ))}
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-faint)', marginTop: 3 }}>⋮ ×8,192</div>
            </div>
          </div>
        ))}
        <div style={{ flex: '1 1 220px', fontSize: 12.5, color: 'var(--text-dim)', alignSelf: 'center', minWidth: 200 }}>
          Each column is one token’s vector — thousands of numbers, learned during training, that
          place the token in a geometric “meaning space”. Everything the model does from here is
          matrix arithmetic on these columns.
          <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-faint)' }}>
            + a positional signal, so “cat sat on mat” ≠ “mat sat on cat”.
          </div>
        </div>
      </div>
    </div>
  )
}

function StageLayers() {
  const SHOW = 7 // rendered layer boxes (of 80)
  return (
    <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 6, flex: '0 0 auto' }}>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center' }}>tokens enter here ↑</div>
        {Array.from({ length: SHOW }).map((_, i) => (
          <div key={i} style={{
            display: 'flex', gap: 6, alignItems: 'center',
            animation: `layerPulse 3.2s ${i * 0.4}s infinite`,
            border: '1px solid var(--border)', borderRadius: 9, padding: '7px 10px', background: 'var(--card)',
          }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-faint)', width: 52 }}>
              {i === SHOW - 1 ? 'layer 80' : i === SHOW - 2 ? '⋯' : `layer ${i + 1}`}
            </span>
            <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'rgba(139,124,247,0.18)', border: '1px solid rgba(139,124,247,0.4)' }}>
              Attention
            </span>
            <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'rgba(56,209,224,0.14)', border: '1px solid rgba(56,209,224,0.35)' }}>
              Feed-forward
            </span>
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center' }}>↑ prediction comes out the top</div>
      </div>
      <div style={{ flex: '1 1 260px', minWidth: 240 }}>
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
            the physical root of the supply-side economics in Module 05.
          </div>
        </div>
      </div>
    </div>
  )
}

function StageAttention() {
  // query = last token " the" attending over the prompt
  const weights = [0.06, 0.42, 0.28, 0.14, 0.1]
  const W = 560, H = 190
  const xs = PROMPT.map((_, i) => 60 + i * ((W - 120) / (PROMPT.length - 1)))
  const qx = xs[xs.length - 1]
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: 620, height: 'auto' }}>
        {PROMPT.slice(0, -1).map((p, i) => {
          const midX = (xs[i] + qx) / 2
          const h = 30 + (1 - weights[i]) * 60
          return (
            <path key={i}
              d={`M ${qx} ${H - 60} Q ${midX} ${H - 60 - (H - 60 - h)} ${xs[i]} ${H - 60}`}
              fill="none" stroke="var(--accent-violet)"
              strokeWidth={1 + weights[i] * 10} opacity={0.25 + weights[i]}
              strokeLinecap="round"
            >
              <animate attributeName="opacity" values={`0;${0.25 + weights[i]}`} dur="0.8s" begin={`${i * 0.15}s`} fill="freeze" />
            </path>
          )
        })}
        {PROMPT.map((p, i) => (
          <g key={i}>
            <rect x={xs[i] - 26} y={H - 58} width={52} height={26} rx={6}
              fill={i === PROMPT.length - 1 ? 'rgba(244,114,182,0.25)' : 'rgba(56,209,224,0.12)'}
              stroke={i === PROMPT.length - 1 ? 'var(--accent-pink)' : 'var(--border-bright)'} />
            <text x={xs[i]} y={H - 40} textAnchor="middle" fill="var(--text)" fontSize="12" fontFamily="var(--mono)">
              {p.t.trim()}
            </text>
            <text x={xs[i]} y={H - 12} textAnchor="middle" fontSize="11" fontFamily="var(--mono)"
              fill={i === PROMPT.length - 1 ? 'var(--accent-pink)' : 'var(--accent-violet)'}>
              {i === PROMPT.length - 1 ? 'query' : `${Math.round(weights[i] * 100)}%`}
            </text>
          </g>
        ))}
      </svg>
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6 }}>
        The last token (“the”, pink) is about to be extended — its query matches most strongly with
        “cat” and “sat”, so their meaning flows into it. The full interactive attention explorer is
        just below this walkthrough.
      </div>
    </div>
  )
}

const CANDIDATES = [
  { t: 'mat', p: 0.52 }, { t: 'floor', p: 0.17 }, { t: 'sofa', p: 0.12 },
  { t: 'windowsill', p: 0.08 }, { t: 'keyboard', p: 0.06 }, { t: '…50,000 more', p: 0.05 },
]

function StagePredict() {
  const [picked, setPicked] = useState(false)
  useEffect(() => { const t = setTimeout(() => setPicked(true), 1600); return () => clearTimeout(t) }, [])
  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 13.5, color: 'var(--text-dim)', marginBottom: 14 }}>
        “The cat sat on the <span style={{ color: 'var(--accent-pink)' }}>▁?</span>”
      </div>
      {CANDIDATES.map((c, i) => (
        <div className="bar-row" key={c.t}>
          <div className="bar-label" style={{ width: 120, fontFamily: 'var(--mono)' }}>{c.t}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{
              width: `${c.p * 160}%`,
              background: i === 0 && picked ? 'var(--accent-green)' : 'var(--accent-violet)',
              boxShadow: i === 0 && picked ? '0 0 12px rgba(74,222,128,0.5)' : 'none',
            }}>
              <span className="bar-value">{(c.p * 100).toFixed(0)}%{i === 0 && picked ? '  ← sampled' : ''}</span>
            </div>
          </div>
        </div>
      ))}
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 10 }}>
        One probability per vocabulary entry, every token. Reasoning models make this step
        deliberate — generating thousands of hidden “thinking” tokens before the visible answer,
        all billed at the output rate.
      </div>
    </div>
  )
}

function StageLoop() {
  const [n, setN] = useState(0)
  const CONT = [' mat', ',', ' purring', ' softly', '.']
  useEffect(() => {
    const iv = setInterval(() => setN((v) => (v >= CONT.length ? v : v + 1)), 850)
    return () => clearInterval(iv)
  }, [])
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          <div style={{ lineHeight: 2.2 }}>
            {PROMPT.map((p, i) => <TokChip key={i} text={p.t} i={i} dim />)}
            {CONT.slice(0, n).map((t, i) => (
              <span key={i} className="token-chip" style={{
                background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.6)',
                fontWeight: 600,
              }}>{t}</span>
            ))}
            {n < CONT.length && <span className="token-chip" style={{ background: 'transparent', border: '1px dashed var(--border-bright)', color: 'var(--text-faint)' }}>▁</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 10 }}>
            {n < CONT.length
              ? <>Generating token {n + 1}… each green token required <strong style={{ color: 'var(--text)' }}>one full pass</strong> through all 80 layers.</>
              : <>Done — 5 output tokens = 5 full passes reading ~140 GB of weights each. Input: one parallel pass. That’s the whole pricing asymmetry.</>}
          </div>
        </div>
        <svg viewBox="0 0 150 150" style={{ width: 130, flexShrink: 0 }}>
          <circle cx="75" cy="75" r="52" fill="none" stroke="var(--border-bright)" strokeWidth="2" strokeDasharray="6 5" />
          <path d="M 75 23 A 52 52 0 1 1 30 100" fill="none" stroke="var(--accent-green)" strokeWidth="3" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 75 75" to="360 75 75" dur="3s" repeatCount="indefinite" />
          </path>
          <text x="75" y="70" textAnchor="middle" fill="var(--text-dim)" fontSize="10.5">sample →</text>
          <text x="75" y="84" textAnchor="middle" fill="var(--text-dim)" fontSize="10.5">append → repeat</text>
        </svg>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* ATTENTION EXPLORER — click any token                                */
/* ------------------------------------------------------------------ */
const SENT = ['The', 'robot', 'picked', 'up', 'the', 'ball', 'because', 'it', 'was', 'heavy']
const CURATED = {
  2: { 1: 0.52, 0: 0.14 },            // picked → robot
  3: { 2: 0.58, 1: 0.16 },            // up → picked
  5: { 4: 0.2, 2: 0.34, 1: 0.18 },    // ball → picked, robot
  7: { 5: 0.55, 1: 0.2, 2: 0.07 },    // it → ball, robot  (coreference!)
  8: { 7: 0.42, 5: 0.22 },            // was → it, ball
  9: { 5: 0.36, 7: 0.3, 8: 0.12 },    // heavy → ball, it
}

function attnWeights(sel) {
  const w = new Array(SENT.length).fill(0)
  const cur = CURATED[sel] || {}
  let used = 0
  for (const [j, v] of Object.entries(cur)) { w[j] = v; used += v }
  // distribute remainder over earlier tokens with recency decay
  const rest = []
  for (let j = 0; j <= sel; j++) if (!(j in cur)) rest.push(j)
  let denom = 0
  for (const j of rest) denom += Math.exp(-(sel - j) * 0.45)
  for (const j of rest) w[j] = ((1 - used) * Math.exp(-(sel - j) * 0.45)) / denom
  return w
}

function AttentionExplorer() {
  const [sel, setSel] = useState(7)
  const w = useMemo(() => attnWeights(sel), [sel])
  const W = 700, H = 200
  const xs = SENT.map((_, i) => 40 + i * ((W - 80) / (SENT.length - 1)))

  return (
    <div className="panel">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {SENT.map((_, j) => {
          if (j > sel || w[j] < 0.02 || j === sel) return null
          const midX = (xs[j] + xs[sel]) / 2
          const arc = 35 + (1 - w[j]) * 75
          return (
            <path key={j}
              d={`M ${xs[sel]} ${H - 66} Q ${midX} ${arc} ${xs[j]} ${H - 66}`}
              fill="none" stroke="var(--accent-violet)"
              strokeWidth={0.8 + w[j] * 11} opacity={0.2 + w[j] * 1.1} strokeLinecap="round"
              style={{ transition: 'all 0.4s' }}
            />
          )
        })}
        {SENT.map((t, i) => (
          <g key={i} onClick={() => setSel(i)} style={{ cursor: 'pointer' }}>
            <rect x={xs[i] - 31} y={H - 64} width={62} height={26} rx={6}
              fill={i === sel ? 'rgba(244,114,182,0.3)' : i <= sel && w[i] > 0.15 ? 'rgba(139,124,247,0.25)' : 'rgba(21,26,40,1)'}
              stroke={i === sel ? 'var(--accent-pink)' : i <= sel && w[i] > 0.15 ? 'var(--accent-violet)' : 'var(--border)'}
              style={{ transition: 'all 0.3s' }} />
            <text x={xs[i]} y={H - 46} textAnchor="middle" fill={i > sel ? 'var(--text-faint)' : 'var(--text)'} fontSize="12.5" fontFamily="var(--mono)">
              {t}
            </text>
            <text x={xs[i]} y={H - 18} textAnchor="middle" fontSize="10.5" fontFamily="var(--mono)"
              fill={i === sel ? 'var(--accent-pink)' : w[i] > 0.02 && i <= sel ? 'var(--accent-violet)' : 'transparent'}>
              {i === sel ? '◄ query' : `${Math.round(w[i] * 100)}%`}
            </text>
          </g>
        ))}
      </svg>
      <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
        {sel === 7
          ? <>Click any word. Right now <strong style={{ color: 'var(--accent-pink)' }}>“it”</strong> is the query — and attention
            resolves the pronoun: 55% of its focus goes to <strong style={{ color: 'var(--accent-violet)' }}>“ball”</strong>. No rule
            was programmed for this; the weights learned it from data.</>
          : <>Query: <strong style={{ color: 'var(--accent-pink)' }}>“{SENT[sel]}”</strong> — attention can only look backwards
            (earlier tokens), which is what makes the model causal. Try “it” or “heavy” for the classic coreference case.</>}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
        This is one attention head. A 70B-class model runs ~64 heads × 80 layers = 5,120 of these
        pattern-matchers in parallel per token — some track syntax, some coreference, some facts.
        Illustrative weights.
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* GENERATION PLAYGROUND — temperature & sampling                      */
/* ------------------------------------------------------------------ */
const START_TEXT = 'The cat sat on the'
const TRANS = {
  _start: [['mat', 50], ['floor', 18], ['sofa', 13], ['windowsill', 10], ['keyboard', 9]],
  mat: [['.', 40], [',', 24], ['and', 20], ['all', 16]],
  floor: [['.', 38], [',', 26], ['and', 22], ['beside', 14]],
  sofa: [['.', 36], [',', 26], ['and', 22], ['cushion', 16]],
  windowsill: [['.', 40], [',', 28], ['watching', 32]],
  keyboard: [['.', 30], ['and', 26], ['deleting', 44]],
  ',': [['purring', 38], ['watching', 30], ['and', 32]],
  and: [['purred', 34], ['refused', 26], ['stared', 24], ['slept', 16]],
  all: [['day', 62], ['morning', 26], ['week', 12]],
  purring: [['softly', 46], ['loudly', 30], ['.', 24]],
  watching: [['the', 55], ['birds', 45]],
  purred: [['softly', 44], ['contentedly', 32], ['.', 24]],
  refused: [['to', 88], ['.', 12]],
  stared: [['at', 70], ['outside', 30]],
  slept: [['.', 60], ['soundly', 40]],
  softly: [['.', 100]],
  loudly: [['.', 100]],
  contentedly: [['.', 100]],
  day: [['.', 100]],
  morning: [['.', 100]],
  week: [['.', 100]],
  the: [['birds', 52], ['rain', 28], ['world', 20]],
  birds: [['.', 100]],
  rain: [['.', 100]],
  world: [['.', 100]],
  to: [['move', 58], ['budge', 42]],
  at: [['nothing', 55], ['everyone', 45]],
  beside: [['it', 100]],
  cushion: [['.', 100]],
  deleting: [['everything', 100]],
  outside: [['.', 100]],
  move: [['.', 100]], budge: [['.', 100]], nothing: [['.', 100]], everyone: [['.', 100]],
  it: [['.', 100]], everything: [['.', 100]],
}
const applyTemp = (dist, T) => {
  const powed = dist.map(([t, p]) => [t, Math.pow(p / 100, 1 / T)])
  const sum = powed.reduce((a, [, p]) => a + p, 0)
  return powed.map(([t, p]) => [t, p / sum])
}

function GenerationPlayground() {
  const [temp, setTemp] = useState(0.8)
  const [gen, setGen] = useState([])
  const [flash, setFlash] = useState(null)
  const done = gen[gen.length - 1] === '.' || gen.length >= 12
  const lastKey = gen.length === 0 ? '_start' : gen[gen.length - 1]
  const dist = applyTemp(TRANS[lastKey] || [['.', 100]], temp)

  const pick = (mode) => {
    if (done) return
    let choice
    if (mode === 'greedy') {
      choice = dist.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
    } else {
      let r = Math.random(), acc = 0
      choice = dist[dist.length - 1][0]
      for (const [t, p] of dist) { acc += p; if (r <= acc) { choice = t; break } }
    }
    setGen((g) => [...g, choice])
    setFlash(choice)
    setTimeout(() => setFlash(null), 500)
  }

  return (
    <div className="panel">
      <div className="grid grid-2" style={{ gap: 28 }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            The sequence so far
          </div>
          <div style={{ lineHeight: 2.1, minHeight: 76, fontFamily: 'var(--mono)', fontSize: 14.5 }}>
            <span style={{ color: 'var(--text-dim)' }}>{START_TEXT}</span>
            {gen.map((t, i) => (
              <span key={i} style={{
                color: t === flash ? 'var(--accent-green)' : 'var(--text)',
                background: t === flash ? 'rgba(74,222,128,0.18)' : 'transparent',
                borderRadius: 4, padding: '1px 2px', fontWeight: 600, transition: 'all 0.4s',
              }}>
                {/^[.,]$/.test(t) ? t : ' ' + t}
              </span>
            ))}
            {!done && <span style={{ color: 'var(--accent-cyan)' }}>▊</span>}
            {done && <span style={{ color: 'var(--accent-green)', fontSize: 11, marginLeft: 10 }}>■ stop token — generation ends</span>}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            <button className="btn primary" disabled={done} onClick={() => pick('sample')}>🎲 Sample next token</button>
            <button className="btn" disabled={done} onClick={() => pick('greedy')}>Greedy (always top)</button>
            <button className="btn" onClick={() => setGen([])}>↺ Reset</button>
          </div>
          <div style={{ marginTop: 18 }}>
            <Slider label="Temperature — how adventurous the sampler is" value={temp} min={0.1} max={2} step={0.1}
              display={temp.toFixed(1) + (temp < 0.4 ? ' · near-deterministic' : temp > 1.3 ? ' · chaotic' : ' · balanced')}
              onChange={setTemp} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Model’s probabilities for the next token
          </div>
          {done ? (
            <div style={{ fontSize: 13, color: 'var(--text-dim)', padding: '20px 0' }}>
              Generation complete. Every visible word cost one full forward pass — hit Reset and try
              a different temperature: low = same sentence every time, high = surprises.
            </div>
          ) : dist.map(([t, p], i) => (
            <div className="bar-row" key={t}>
              <div className="bar-label" style={{ width: 110, fontFamily: 'var(--mono)' }}>{t}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${p * 100}%`, background: i === 0 ? 'var(--accent-cyan)' : 'var(--accent-violet)' }}>
                  <span className="bar-value">{(p * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
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
export default function HowLLMsWork() {
  return (
    <Section
      id="llm"
      kicker="Module 02 · Inside the model"
      title="How an LLM actually produces a token"
      lede={
        <>
          Before the economics makes sense, you need the machine. An LLM does exactly one thing:
          given a sequence of tokens, it predicts a probability for <strong>every possible next
          token</strong> — then the chosen one is fed back in and it does it again. Walk through the
          seven stages of that loop below.
        </>
      }
    >
      <Block title="The token factory — step through the machine" sub="Follow “The cat sat on the” all the way to the next token. Use Next / Auto-play.">
        <LLMWalkthrough />
      </Block>

      <Block
        title="Attention, hands-on"
        sub="The transformer’s superpower is letting every token look back at every earlier token. Click any word to make it the query."
      >
        <AttentionExplorer />
      </Block>

      <Block
        title="Be the sampler — generate a sentence yourself"
        sub="The model proposes probabilities; the sampler picks. Generate token by token and feel the autoregressive loop."
      >
        <GenerationPlayground />
      </Block>

      <Callout tone="pink" title="Why this machine shapes every price you saw in Module 01">
        Three consequences fall straight out of the architecture. <strong>Generation is
        sequential</strong> — one full pass through all ~80 layers, reading every weight, per output
        token — which is why output costs 3–8× input. <strong>Attention needs every previous
        token’s state</strong> — kept in GPU memory as the KV cache, which is why long context is
        surcharged and why cached prompt prefixes get ~90% off. And <strong>parameters are read
        from memory each token</strong> — so model size × precision sets a hard physical floor
        under every price. Modules 05–07 build the economics on exactly these three facts.
      </Callout>
    </Section>
  )
}
