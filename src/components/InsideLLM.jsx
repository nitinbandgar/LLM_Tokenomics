import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { Section, Block, Slider, ResultStrip, Callout } from './ui.jsx'
import { fmtUSD } from '../data.js'
import { EXAMPLES, noise, applyTemp } from '../examples.js'

const Transformer3D = React.lazy(() => import('./Transformer3D.jsx'))

const CHIP_COLORS = ['#38d1e0', '#8b7cf7', '#f472b6', '#4ade80', '#fb923c', '#facc15']

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
    desc: 'The model never sees just the latest message. The system prompt, conversation history, retrieved documents and tool outputs are concatenated with it into one long sequence — the context window. This whole sequence is the input, every single turn, and every part of it is billed.' },
  { key: 'tokenize', label: 'Tokenize', title: '2 · The text becomes token IDs',
    desc: 'A tokenizer splits the text into subword units and maps each to an integer ID from a fixed vocabulary (~100K entries here). Common words are one token; rare words split into pieces. From here on, the model only ever sees numbers — and this is exactly the unit on your invoice.' },
  { key: 'embed', label: 'Embed', title: '3 · Token IDs become vectors',
    desc: 'Each ID looks up a learned embedding — a vector of thousands of numbers (e.g. 8,192 dimensions) encoding the token’s meaning as geometry: "cat" and "kitten" end up near each other. Position information is mixed in so the model knows word order. These vectors are what actually flow through the network.' },
  { key: 'layers', label: 'Layers · 3D', title: '4 · Through the transformer stack — in 3D',
    desc: 'The tokens now flow left → right through a deep stack of identical layers (~80 in a 70B-class model; 10 shown). In each layer, attention lets the tokens exchange information (pink flashes), then a feed-forward network transforms each one. From the final layer (pink) a prediction (green) emerges — and loops straight back to the entrance as the next input token. Drag to orbit, then dissect the machinery in the three panels below.' },
  { key: 'attention', label: 'Attention', title: '5 · Attention: every token looks back',
    desc: 'Inside each layer, every token computes a query and compares it against the keys of all previous tokens. The match scores become weights, and the token pulls in a weighted blend of their values — meaning flows between positions. Click any token to make it the query.' },
  { key: 'predict', label: 'Predict', title: '6 · One probability for every token in the vocabulary',
    desc: 'After the final layer, the last token’s vector is projected onto the whole vocabulary and squashed into a probability distribution (softmax). The model doesn’t "know" the next word — it scores every candidate, and a sampler picks one.' },
  { key: 'loop', label: 'Loop & stream', title: '7 · The chosen token is fed straight back in',
    desc: 'The sampled token is appended to the sequence and the entire process repeats — one full pass through all the layers, reading all the weights, per token. This autoregressive loop is what you see as a stream of tokens in a chat window, and it is why output tokens cost more than input tokens (Module 02).' },
]

/* Stage 1 — context assembly around the chosen sentence */
function StageContext({ text, nTok }) {
  const [merged, setMerged] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMerged(true), 600); return () => clearTimeout(t) }, [])
  const parts = [
    { name: 'System prompt', ex: '“You are a helpful assistant…”', color: 'var(--accent-violet)', tok: '~1,200 tokens' },
    { name: 'Conversation history', ex: 'every earlier turn', color: 'var(--accent-cyan)', tok: '~2,400 tokens' },
    { name: 'Retrieved docs / tool output', ex: 'RAG passages, file contents', color: 'var(--accent-orange)', tok: '~3,000 tokens' },
    { name: 'The new message', ex: `“${text}…”`, color: 'var(--accent-pink)', tok: `${nTok} tokens` },
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
        The context window — ~6,600 tokens here. The actual message is the thin pink sliver: in
        enterprise workloads most billed input is scaffolding, which is why context engineering
        (Module 07) is such a big lever.
      </div>
    </div>
  )
}

/* Stage 2 — the sentence as real BPE tokens */
function StageTokenize({ tokens, text }) {
  const chars = text.length
  const words = text.trim().split(/\s+/).length
  return (
    <div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {tokens.map((t, i) => (
          <div key={i} style={{ textAlign: 'center', animation: `tokenIn 0.3s ${i * 0.08}s both` }}>
            <TokChip text={t.text} i={i} big />
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--accent-cyan)', marginTop: 5 }}>{t.id}</div>
            <div style={{ fontSize: 9.5, color: 'var(--text-faint)' }}>token ID</div>
          </div>
        ))}
      </div>
      <ResultStrip items={[
        { label: 'Tokens', value: tokens.length },
        { label: 'Characters', value: chars, note: `${(chars / tokens.length).toFixed(1)} chars / token` },
        { label: 'Words', value: words, note: `${(tokens.length / words).toFixed(2)} tokens / word` },
        { label: 'As input @ $3/M', value: fmtUSD((tokens.length / 1e6) * 3, 6), note: 'one request — pennies; billions add up' },
      ]} />
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 12 }}>
        These are <strong style={{ color: 'var(--text)' }}>real BPE token IDs</strong> from the
        cl100k_base vocabulary used by GPT-4-class models. Common words are single tokens; rarer
        ones split — pick “The tokenomics one” above and notice “LLM” becoming two tokens
        (“ L” + “LM”). Rule of thumb: 1 token ≈ 4 characters ≈ ¾ of an English word. Vocabulary
        design matters commercially — the same sentence can be ~20% more tokens in one model family
        than another, silently changing the bill.
      </div>
    </div>
  )
}

/* Stage 3 — embeddings */
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
          Each column is one token as a vector — thousands of numbers, learned during training, that
          place the token in a geometric “meaning space”. Everything the model does from here is
          matrix arithmetic on these columns. (Cell colours are illustrative, deterministically
          derived from each real token ID.)
          <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-faint)' }}>
            + a positional signal, so “cat sat on mat” ≠ “mat sat on cat”.
          </div>
        </div>
      </div>
    </div>
  )
}

/* Stage 4 — the 3D transformer stack + dissection panels */
const STATUS_TEXT = {
  embed: 'The token vectors enter the stack from the left…',
  layers: 'Flowing left → right: in each layer, attention (pink flashes) mixes information between the tokens, then a feed-forward network transforms each one.',
  predict: 'Out of the final layer: the next-token prediction (green) emerges on the right — and is fed back to the entrance for the next pass.',
}

// A small labelled step box used inside the dissection cards
function FlowStep({ color, title, children }) {
  return (
    <div style={{
      border: `1px solid ${color}55`, background: `${color}0d`, borderRadius: 8,
      padding: '8px 10px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, fontSize: 11.5, color, marginBottom: 2 }}>{title}</div>
      <div style={{ color: 'var(--text-dim)', lineHeight: 1.45 }}>{children}</div>
    </div>
  )
}
const FlowArrow = () => (
  <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 11, lineHeight: '14px' }}>↓</div>
)

function LayerAnatomyCard() {
  return (
    <div className="card" style={{ padding: 16, borderColor: 'rgba(56,209,224,0.45)' }}>
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)', marginBottom: 10, fontWeight: 700 }}>
        🔍 Inside one layer — the cyan slab
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <FlowStep color="#9aa5bd" title="Token vectors arrive">
          One vector of 8,192 numbers per token — the output of the previous layer.
        </FlowStep>
        <FlowArrow />
        <FlowStep color="#8b7cf7" title="Attention — tokens talk to each other">
          Every token compares its <em>query</em> against all earlier tokens’ <em>keys</em> and
          pulls in a weighted blend of their <em>values</em>. This is the only place information
          moves <strong style={{ color: 'var(--text)' }}>between</strong> positions.
        </FlowStep>
        <FlowArrow />
        <FlowStep color="#9aa5bd" title="Add & normalise">
          The blend is added on top of what each token already carried (a residual connection),
          so nothing learned earlier is lost.
        </FlowStep>
        <FlowArrow />
        <FlowStep color="#38d1e0" title="Feed-forward — each token thinks alone">
          Each vector is expanded 8,192 → 28,672 numbers, passed through a non-linearity, and
          projected back. No mixing between positions — pure per-token processing.
        </FlowStep>
        <FlowArrow />
        <FlowStep color="#9aa5bd" title="Handed to the next layer">
          Same shape out as in — which is why the identical block can repeat ×80.
        </FlowStep>
      </div>
    </div>
  )
}

function FinalLayerCard() {
  return (
    <div className="card" style={{ padding: 16, borderColor: 'rgba(244,114,182,0.45)' }}>
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-pink)', marginBottom: 10, fontWeight: 700 }}>
        🎯 After the last layer — where the token is born
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <FlowStep color="#f472b6" title="Take the last token's vector only">
          After 80 layers, the final position’s 8,192 numbers summarise the entire sentence —
          everything needed to guess what comes next.
        </FlowStep>
        <FlowArrow />
        <FlowStep color="#f472b6" title="Project onto the whole vocabulary">
          Multiply by the output matrix (8,192 × ~128K): one raw score for{' '}
          <strong style={{ color: 'var(--text)' }}>every token the model knows</strong>.
        </FlowStep>
        <FlowArrow />
        <FlowStep color="#f472b6" title="Softmax → probabilities">
          The scores become the probability bars you’ll see in Stage 6.
        </FlowStep>
        <FlowArrow />
        <FlowStep color="#4ade80" title="Sample one token">
          The sampler picks (greedy or with temperature) — this is the green sphere.
        </FlowStep>
        <FlowArrow />
        <FlowStep color="#4ade80" title="↺ Feed it back in">
          The new token joins the input on the left, and the whole stack runs again —
          Stage 7 is exactly this loop.
        </FlowStep>
      </div>
    </div>
  )
}

function ParamMathCard() {
  const rows = [
    { label: 'Attention (Q, K, V, O matrices)', math: '≈ 0.15B per layer × 80 layers', value: '≈ 12B', color: 'var(--accent-violet)' },
    { label: 'Feed-forward (3 big matrices)', math: '≈ 0.70B per layer × 80 layers', value: '≈ 56B', color: 'var(--accent-cyan)' },
    { label: 'Token embeddings (way in)', math: '~128K vocab × 8,192 dims', value: '≈ 1B', color: 'var(--accent-yellow)' },
    { label: 'Output projection (way out)', math: '8,192 dims × ~128K vocab', value: '≈ 1B', color: 'var(--accent-pink)' },
  ]
  return (
    <div className="card" style={{ padding: 16, borderColor: 'rgba(139,124,247,0.45)' }}>
      <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-violet)', marginBottom: 10, fontWeight: 700 }}>
        🧮 Where “70B parameters” comes from
      </div>
      {rows.map((r) => (
        <div key={r.label} style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5 }}>
            <span style={{ color: 'var(--text-dim)' }}>{r.label}</span>
            <span style={{ fontFamily: 'var(--mono)', color: r.color, flexShrink: 0, fontWeight: 600 }}>{r.value}</span>
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-faint)', marginTop: 2 }}>{r.math}</div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13, padding: '9px 0 2px', fontWeight: 700 }}>
        <span style={{ color: 'var(--text)' }}>Total</span>
        <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent-green)' }}>12 + 56 + 1 + 1 ≈ 70B</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
        Every one of these 70 billion numbers is a learned weight — ~140 GB at 16-bit — and{' '}
        <strong style={{ color: 'var(--text)' }}>all of them are read from GPU memory for every
        single generated token</strong>. That is the physical root of the economics in Modules 02
        and 05.
      </div>
    </div>
  )
}

function StageLayers({ tokens }) {
  const [status, setStatus] = useState('embed')
  return (
    <div>
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'radial-gradient(ellipse at 50% 40%, rgba(139,124,247,0.07), transparent 70%)' }}>
        <Suspense fallback={
          <div style={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
            Loading the 3D transformer…
          </div>
        }>
          <Transformer3D tokenCount={Math.min(10, Math.max(2, tokens.length))} onStatus={setStatus} />
        </Suspense>
        <div style={{ padding: '10px 14px', fontSize: 12.5, color: 'var(--text-dim)', borderTop: '1px solid var(--border)', minHeight: 56 }}>
          {STATUS_TEXT[status]}
          <span style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: 'var(--text-faint)', marginTop: 5 }}>
            <span>🖱 drag to orbit · tokens flow left → right</span>
            <span><span style={{ color: 'var(--accent-violet)' }}>■</span> one of ~80 layers</span>
            <span><span style={{ color: 'var(--accent-cyan)' }}>■</span> the layer dissected below</span>
            <span><span style={{ color: 'var(--accent-pink)' }}>■</span> final layer → prediction</span>
            <span><span style={{ color: 'var(--accent-green)' }}>●</span> the new token, looping back</span>
          </span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 16 }}>
        <LayerAnatomyCard />
        <FinalLayerCard />
        <ParamMathCard />
      </div>
    </div>
  )
}

/* Stage 5 — attention with curated weights per example */
function attnWeights(example, q) {
  const n = example.tokens.length
  const w = new Array(n).fill(0)
  if (q <= 0) return w
  const cur = example.attn[q] || {}
  let used = 0
  for (const [j, v] of Object.entries(cur)) { w[j] = v; used += v }
  // distribute the remainder over the other earlier tokens with recency decay
  const rest = []
  for (let j = 0; j < q; j++) if (!(j in cur)) rest.push(j)
  let denom = 0
  for (const j of rest) denom += Math.exp(-(q - j) * 0.45)
  for (const j of rest) w[j] = ((1 - used) * Math.exp(-(q - j) * 0.45)) / denom
  return w
}

function StageAttention({ example }) {
  const view = example.tokens
  const [sel, setSel] = useState(-1)
  const q = sel >= 0 && sel < view.length ? sel : example.defaultQuery
  const w = useMemo(() => attnWeights(example, q), [example, q])

  const W = 700, H = 210
  const xs = view.map((_, i) => 45 + i * ((W - 90) / Math.max(1, view.length - 1)))
  const boxW = Math.min(64, (W - 90) / view.length + 14)
  const label = (t) => {
    const s = t.text.trim() || '␣'
    return s.length > 7 ? s.slice(0, 6) + '…' : s
  }

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
        {q === example.defaultQuery
          ? <><strong style={{ color: 'var(--accent-pink)' }}>“{view[q].text.trim()}”</strong> is the query — {example.attnNote}</>
          : <>Query: <strong style={{ color: 'var(--accent-pink)' }}>“{view[q].text.trim() || '␣'}”</strong> — attention can only look
            backwards (earlier tokens), which is what makes the model causal. Click{' '}
            <strong style={{ color: 'var(--accent-violet)' }}>“{view[example.defaultQuery].text.trim()}”</strong> for this sentence’s
            most interesting case.</>}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
        This is one attention head — a 70B-class model runs ~64 heads × 80 layers = 5,120 of these
        pattern-matchers in parallel per token: some track syntax, some coreference, some facts.
        Weights curated for this sentence, for clarity.
      </div>
    </div>
  )
}

/* Stage 6 — the next-token distribution (= the loop's first step) */
function StagePredict({ example }) {
  const [picked, setPicked] = useState(false)
  useEffect(() => { setPicked(false); const t = setTimeout(() => setPicked(true), 1600); return () => clearTimeout(t) }, [example])
  const dist = useMemo(() => applyTemp(example.tree._start, 1), [example])
  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 13.5, color: 'var(--text-dim)', marginBottom: 14 }}>
        “{example.text} <span style={{ color: 'var(--accent-pink)' }}>▁?</span>”
      </div>
      {dist.map(([t, p], i) => (
        <div className="bar-row" key={t}>
          <div className="bar-label" style={{ width: 120, fontFamily: 'var(--mono)' }}>{t}</div>
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
      <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 10 }}>{example.predictNote}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
        One probability per vocabulary entry, recomputed for every token. Reasoning models make this
        step deliberate — thousands of hidden “thinking” tokens before the visible answer, all
        billed at the output rate. (Probabilities curated for this sentence.)
      </div>
    </div>
  )
}

/* Stage 7 — the autoregressive loop, streaming the curated continuation */
function StageLoop({ example }) {
  const [temp, setTemp] = useState(0.8)
  const [gen, setGen] = useState([])
  const [auto, setAuto] = useState(false)
  const [flash, setFlash] = useState(-1)

  const key = gen.length === 0 ? '_start' : gen[gen.length - 1]
  const done = key === '.' || gen.length >= 14
  const dist = useMemo(() => applyTemp(example.tree[key] || [['.', 100]], temp), [example, key, temp])

  const step = (mode) => {
    if (done) return
    let choice
    if (mode === 'greedy') choice = dist[0][0]
    else {
      let r = Math.random(), acc = 0
      choice = dist[dist.length - 1][0]
      for (const [t, p] of dist) { acc += p; if (r <= acc) { choice = t; break } }
    }
    setGen((g) => [...g, choice])
    setFlash(gen.length)
    setTimeout(() => setFlash(-1), 500)
  }

  useEffect(() => {
    if (!auto || done) { if (done) setAuto(false); return }
    const t = setTimeout(() => step('sample'), 650)
    return () => clearTimeout(t)
  }, [auto, gen, done]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="grid grid-2" style={{ gap: 28 }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            The sequence, streaming
          </div>
          <div style={{ lineHeight: 2.2, minHeight: 90 }}>
            {example.tokens.map((t, i) => <TokChip key={i} text={t.text} i={i} dim />)}
            {gen.map((g, i) => (
              <span key={i} className="token-chip" style={{
                background: i === flash ? 'rgba(74,222,128,0.45)' : 'rgba(74,222,128,0.2)',
                border: '1px solid rgba(74,222,128,0.6)', fontWeight: 600, transition: 'background 0.4s',
              }}>{/^[.,]/.test(g) ? g : ' ' + g}</span>
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
              forward passes</strong>, each reading ~140 GB of weights. The whole input was one parallel pass.
              Hit Reset and try a different temperature — low repeats itself, high surprises.
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
          {!done && (
            <ResultStrip items={[
              { label: 'Forward passes so far', value: gen.length, note: 'one per output token' },
              { label: 'Temperature', value: temp.toFixed(1) },
            ]} />
          )}
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 10 }}>
            Temperature reshapes the same underlying scores: T→0 concentrates all probability on the
            top token; high T flattens the field. The continuation is curated for this sentence —
            the mechanics (score → temperature → sample → append → repeat) are exactly real.
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* The walkthrough shell                                               */
/* ------------------------------------------------------------------ */
function Walkthrough({ example }) {
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

        {s.key === 'context' && <StageContext text={example.text} nTok={example.tokens.length} />}
        {s.key === 'tokenize' && <StageTokenize tokens={example.tokens} text={example.text} />}
        {s.key === 'embed' && <StageEmbed tokens={example.tokens} />}
        {s.key === 'layers' && <StageLayers tokens={example.tokens} />}
        {s.key === 'attention' && <StageAttention key={example.id} example={example} />}
        {s.key === 'predict' && <StagePredict example={example} />}
        {s.key === 'loop' && <StageLoop key={example.id} example={example} />}
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
  const [exampleId, setExampleId] = useState(EXAMPLES[1].id)
  const example = EXAMPLES.find((e) => e.id === exampleId)

  return (
    <Section
      id="llm"
      kicker="Module 01 · Inside the model"
      title="How an LLM works — follow a sentence through the machine"
      lede={
        <>
          An LLM does exactly one thing: given a sequence of tokens, it predicts a probability for{' '}
          <strong>every possible next token</strong> — then the chosen one is fed back in and it does
          it again. Pick a sentence below, then follow it through all seven stages of that loop:
          tokens → embeddings → the 3D transformer stack → attention → prediction → the stream.
        </>
      }
    >
      <Block title="Start here: pick a sentence" sub="Every stage below — token IDs, attention scores, predictions, the streamed continuation — is precomputed for these sentences, so all the numbers line up and make sense.">
        <div className="panel" style={{ paddingBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {EXAMPLES.map((e) => (
              <button
                key={e.id}
                onClick={() => setExampleId(e.id)}
                className="card"
                style={{
                  flex: '1 1 220px', textAlign: 'left', cursor: 'pointer', padding: 14,
                  borderColor: e.id === exampleId ? 'var(--accent-cyan)' : undefined,
                  background: e.id === exampleId ? 'rgba(56,209,224,0.07)' : undefined,
                  font: 'inherit', color: 'inherit',
                }}
              >
                <div style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: e.id === exampleId ? 'var(--accent-cyan)' : 'var(--text-faint)', marginBottom: 6 }}>
                  {e.label}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text)' }}>“{e.text}…”</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-faint)', marginTop: 6 }}>
                  {e.tokens.length} tokens
                </div>
              </button>
            ))}
          </div>
        </div>
      </Block>

      <Block title="The token factory — step through the machine" sub="Seven stages from text to a streaming answer. Use Next, or Auto-play all.">
        <Walkthrough example={example} />
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
