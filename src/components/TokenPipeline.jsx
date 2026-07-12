import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Section, Block, Slider, ResultStrip, Callout } from './ui.jsx'
import { fmtUSD } from '../data.js'

const TOKEN_COLORS = [
  'rgba(56,209,224,0.22)', 'rgba(139,124,247,0.25)', 'rgba(244,114,182,0.22)',
  'rgba(74,222,128,0.2)', 'rgba(251,146,60,0.22)', 'rgba(250,204,21,0.18)',
]
const TOKEN_BORDERS = ['#38d1e0', '#8b7cf7', '#f472b6', '#4ade80', '#fb923c', '#facc15']

// Approximate BPE-style tokenization: splits words into subword chunks the way
// real tokenizers roughly do (common short words = 1 token; long words split).
function pseudoTokenize(text) {
  const tokens = []
  const words = text.split(/(\s+)/)
  for (const w of words) {
    if (!w) continue
    if (/^\s+$/.test(w)) {
      // whitespace attaches to the next token in real BPE; emulate by prefixing
      tokens.push({ text: w, ws: true })
      continue
    }
    let word = w
    // split punctuation off
    const parts = word.match(/[A-Za-z0-9]+|[^A-Za-z0-9]+/g) || [word]
    for (const p of parts) {
      if (p.length <= 4 || /^[^A-Za-z0-9]+$/.test(p)) {
        tokens.push({ text: p })
      } else {
        // chunk long words into 3-5 char pieces
        let i = 0
        while (i < p.length) {
          const size = i === 0 ? Math.min(4, p.length) : Math.min(3 + ((i * 7) % 3), p.length - i)
          tokens.push({ text: p.slice(i, i + size), sub: true })
          i += size
        }
      }
    }
  }
  // merge whitespace into following token for display
  const merged = []
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].ws && i + 1 < tokens.length) {
      merged.push({ ...tokens[i + 1], text: tokens[i].text + tokens[i + 1].text })
      i++
    } else if (!tokens[i].ws) {
      merged.push(tokens[i])
    } else {
      merged.push(tokens[i])
    }
  }
  return merged
}

function TokenizerDemo() {
  const [text, setText] = useState(
    'Enterprise LLM bills are exploding even as token prices collapse. Understanding tokenomics is now a core engineering discipline.',
  )
  const tokens = useMemo(() => pseudoTokenize(text), [text])
  const chars = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="panel">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        style={{
          width: '100%', background: 'var(--bg)', color: 'var(--text)',
          border: '1px solid var(--border-bright)', borderRadius: 10, padding: 14,
          fontFamily: 'var(--sans)', fontSize: 14.5, resize: 'vertical', outline: 'none',
        }}
        placeholder="Type anything to see how a model would tokenize it…"
      />
      <div style={{ margin: '16px 0 6px', fontSize: 12, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Token view (illustrative BPE-style split)
      </div>
      <div style={{ lineHeight: 2, minHeight: 44 }}>
        {tokens.map((t, i) => (
          <span
            key={i}
            className="token-chip"
            style={{
              background: TOKEN_COLORS[i % TOKEN_COLORS.length],
              border: `1px solid ${TOKEN_BORDERS[i % TOKEN_BORDERS.length]}44`,
            }}
          >
            {t.text.replace(/ /g, ' ')}
          </span>
        ))}
      </div>
      <ResultStrip
        items={[
          { label: 'Tokens', value: tokens.length },
          { label: 'Characters', value: chars, note: `${(chars / Math.max(1, tokens.length)).toFixed(1)} chars / token` },
          { label: 'Words', value: words, note: `${(tokens.length / Math.max(1, words)).toFixed(2)} tokens / word` },
          {
            label: 'As input @ $3/M',
            value: fmtUSD((tokens.length / 1e6) * 3, 6),
            note: 'one request — pennies; billions add up',
          },
        ]}
      />
      <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 12 }}>
        Rule of thumb: 1 token ≈ 4 characters ≈ ¾ of an English word. Vocabulary design matters
        commercially — the same sentence can be ~20% more tokens in one model family than another,
        silently changing the bill.
      </div>
    </div>
  )
}

// Animated 4-stage request pipeline
const N_IN = 24
const N_OUT = 12

function PipelineAnimation() {
  const [phase, setPhase] = useState('idle') // idle | tokenize | prefill | decode | done
  const [decoded, setDecoded] = useState(0)
  const timers = useRef([])

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  const play = () => {
    clearTimers()
    setPhase('tokenize')
    setDecoded(0)
    timers.current.push(setTimeout(() => setPhase('prefill'), 900))
    timers.current.push(setTimeout(() => setPhase('decode'), 2000))
    for (let i = 1; i <= N_OUT; i++) {
      timers.current.push(setTimeout(() => setDecoded(i), 2000 + i * 420))
    }
    timers.current.push(setTimeout(() => setPhase('done'), 2000 + N_OUT * 420 + 400))
  }

  useEffect(() => clearTimers, [])

  const stageStyle = (name) => ({
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${phase === name ? 'var(--accent-cyan)' : 'var(--border)'}`,
    background: phase === name ? 'rgba(56,209,224,0.08)' : 'var(--card)',
    fontSize: 13,
    fontWeight: 600,
    color: phase === name ? 'var(--accent-cyan)' : 'var(--text-dim)',
    transition: 'all 0.25s',
    flex: 1,
    textAlign: 'center',
  })

  return (
    <div className="panel">
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        <div style={stageStyle('tokenize')}>1 · Tokenize</div>
        <div style={stageStyle('prefill')}>2 · Prefill <span style={{ fontWeight: 400 }}>(parallel)</span></div>
        <div style={stageStyle('decode')}>3 · Decode <span style={{ fontWeight: 400 }}>(one at a time)</span></div>
        <div style={stageStyle('done')}>4 · Stream</div>
      </div>

      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--accent-cyan)', marginBottom: 8, fontFamily: 'var(--mono)' }}>
            INPUT — {N_IN} tokens · processed in ONE parallel pass
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 17px)', gap: 5 }}>
            {Array.from({ length: N_IN }).map((_, i) => (
              <div
                key={i}
                className={
                  'pipe-cell' +
                  (phase === 'prefill' || phase === 'decode' || phase === 'done' ? ' lit-in' : '')
                }
                style={{ transitionDelay: phase === 'prefill' ? '0.05s' : '0s' }}
              />
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
            Compute-bound · 10–100× more tokens per GPU-second
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11.5, color: 'var(--accent-pink)', marginBottom: 8, fontFamily: 'var(--mono)' }}>
            OUTPUT — {N_OUT} tokens · one full weight-read EACH
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 17px)', gap: 5 }}>
            {Array.from({ length: N_OUT }).map((_, i) => (
              <div
                key={i}
                className={'pipe-cell ' + (i < decoded ? 'lit-out' : phase === 'decode' || phase === 'done' ? 'pending-out' : '')}
              />
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
            Memory-bandwidth-bound · every weight re-read per token
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
        <button className="btn primary" onClick={play}>
          {phase === 'idle' ? '▶ Run a request' : '↻ Replay'}
        </button>
        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          {phase === 'idle' && 'Press play to follow one request through the serving stack.'}
          {phase === 'tokenize' && 'Splitting the prompt into tokens…'}
          {phase === 'prefill' && 'Prefill: the whole prompt computed together — fast and cheap.'}
          {phase === 'decode' && `Decoding token ${decoded}/${N_OUT} — each one reads ~all model weights from memory.`}
          {phase === 'done' && 'Done. Notice the asymmetry: 24 input tokens took one pass; 12 output tokens took 12 passes.'}
        </div>
      </div>
    </div>
  )
}

function AsymmetryExplorer() {
  const [inTok, setInTok] = useState(2000)
  const [outTok, setOutTok] = useState(500)
  const inRate = 3, outRate = 15 // Sonnet-class $/M
  const inCost = (inTok / 1e6) * inRate
  const outCost = (outTok / 1e6) * outRate
  const total = inCost + outCost
  const maxBar = Math.max(inCost, outCost, 1e-9)

  return (
    <div className="panel">
      <div className="grid grid-2" style={{ gap: 28 }}>
        <div>
          <Slider label="Input tokens (prompt + context)" value={inTok} min={100} max={20000} step={100}
            display={inTok.toLocaleString()} onChange={setInTok} />
          <Slider label="Output tokens (response)" value={outTok} min={50} max={5000} step={50}
            display={outTok.toLocaleString()} onChange={setOutTok} />
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
            Priced at a workhorse tier: $3/M input · $15/M output (5× asymmetry).
          </div>
        </div>
        <div>
          <div className="bar-row">
            <div className="bar-label">Input cost</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(inCost / maxBar) * 100}%`, background: 'var(--accent-cyan)' }}>
                <span className="bar-value">{fmtUSD(inCost, 5)}</span>
              </div>
            </div>
          </div>
          <div className="bar-row">
            <div className="bar-label">Output cost</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(outCost / maxBar) * 100}%`, background: 'var(--accent-pink)' }}>
                <span className="bar-value">{fmtUSD(outCost, 5)}</span>
              </div>
            </div>
          </div>
          <ResultStrip items={[
            { label: 'This request', value: fmtUSD(total, 5) },
            { label: '× 100K requests / month', value: fmtUSD(total * 100000), note: 'the enterprise view' },
            { label: 'Output share', value: `${Math.round((outCost / total) * 100)}%`, color: 'var(--accent-pink)' },
          ]} />
        </div>
      </div>
    </div>
  )
}

export default function TokenPipeline() {
  return (
    <Section
      id="tokens"
      kicker="Module 01 · How LLMs work"
      title="Every bill starts with a token"
      lede={
        <>
          A token is a fragment of text — roughly four characters, about ¾ of an English word.
          Models read and write the world in tokens, and providers meter and bill in tokens.
          To reason about cost, follow one request through the serving stack.
        </>
      }
    >
      <Block title="Try the tokenizer" sub="Type any text and watch it split into billable units.">
        <TokenizerDemo />
      </Block>

      <Block
        title="The four stages of a request"
        sub="Prefill is parallel and cheap. Decoding is sequential and expensive. This single fact explains most LLM pricing."
      >
        <PipelineAnimation />
      </Block>

      <Callout tone="pink" title="The first asymmetry">
        Output tokens are priced <strong>3–8× higher than input tokens</strong> across virtually
        every provider. This is not marketing — prefill processes the whole prompt in one parallel
        pass, while decoding pays a full memory-bound pass per generated token. The same physics
        makes prompt caching honest: if the provider keeps your prompt’s KV cache in memory,
        re-processing is nearly free, so cached input can be discounted ~90% and remain profitable.
      </Callout>

      <Block title="Feel the asymmetry" sub="Drag the sliders — watch which side of the meter dominates your cost.">
        <AsymmetryExplorer />
      </Block>

      <details className="expand">
        <summary>Go deeper: the three physical quantities behind every token price</summary>
        <div className="expand-body">
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--text)' }}>Context window.</strong> Everything the model
            attends to in a call — system prompt, history, retrieved documents, tool outputs. The
            full context is re-sent (and re-billed) on every turn; long context also shrinks
            provider batch sizes, so it is priced steeply.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--text)' }}>KV cache.</strong> GPU memory holding attention
            state for every token of every active sequence. It grows linearly with context length ×
            concurrency and competes with model weights for scarce HBM — the physical reason long
            context costs more. (Module 04 lets you play with this.)
          </p>
          <p>
            <strong style={{ color: 'var(--text)' }}>Parameters &amp; precision.</strong> The weights
            read on every decoded token; precision (FP16 → FP8 → FP4) sets bytes per weight. Weight
            bytes ÷ memory bandwidth bounds tokens/second — quantisation directly cuts the
            serving-cost floor.
          </p>
        </div>
      </details>
    </Section>
  )
}
