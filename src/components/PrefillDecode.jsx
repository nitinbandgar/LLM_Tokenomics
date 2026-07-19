import React, { useEffect, useRef, useState } from 'react'
import { Section, Block, Slider, ResultStrip, Callout, More } from './ui.jsx'
import { MODEL_PRICES, fmtUSD } from '../data.js'

/* ------------------------------------------------------------------ */
/* Animated 4-stage request pipeline                                   */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* The time race: where a request's wall-clock time actually goes      */
/* ------------------------------------------------------------------ */
const PREFILL_RATE = 20000 // tokens/s ingested during prefill (illustrative)
const DECODE_RATE = 60 // tokens/s generated during decode (illustrative)

function PhaseRace() {
  const [inTok, setInTok] = useState(10000)
  const [outTok, setOutTok] = useState(500)

  const ttft = inTok / PREFILL_RATE
  const gen = outTok / DECODE_RATE
  const total = ttft + gen
  const fmt = (s) => (s < 1 ? `${(s * 1000).toFixed(0)} ms` : `${s.toFixed(1)} s`)

  return (
    <div className="panel">
      <div className="grid grid-2" style={{ gap: 28 }}>
        <div>
          <Slider label="Input tokens (the whole context)" value={inTok} min={500} max={100000} step={500}
            display={inTok.toLocaleString()} onChange={setInTok} />
          <Slider label="Output tokens (the response)" value={outTok} min={20} max={2000} step={20}
            display={outTok.toLocaleString()} onChange={setOutTok} />
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
            Prefill ingests ~{PREFILL_RATE.toLocaleString()} tok/s; decode emits ~{DECODE_RATE} tok/s.
          </div>
          <More>
            Illustrative single-request rates — real numbers vary by model and hardware, but the
            ratio between them (two to three orders of magnitude) does not.
          </More>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Where the request’s time goes
          </div>
          <div style={{ display: 'flex', height: 38, borderRadius: 9, overflow: 'hidden', border: '1px solid var(--border-bright)' }}>
            <div style={{
              width: `${Math.max(1.5, (ttft / total) * 100)}%`, background: 'var(--accent-cyan)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#0b0e17', transition: 'width 0.25s', minWidth: 4,
            }}>
              {(ttft / total) > 0.14 ? 'prefill' : ''}
            </div>
            <div style={{
              width: `${(gen / total) * 100}%`, background: 'var(--accent-pink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#0b0e17', transition: 'width 0.25s',
            }}>
              {(gen / total) > 0.14 ? 'decode' : ''}
            </div>
          </div>
          <div className="legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent-cyan)' }} />prefill · reads {inTok.toLocaleString()} tokens</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent-pink)' }} />decode · writes {outTok.toLocaleString()} tokens</div>
          </div>
          <ResultStrip items={[
            { label: 'Time to first token', value: fmt(ttft), note: 'the prefill pass', color: 'var(--accent-cyan)' },
            { label: 'Generation time', value: fmt(gen), note: `${outTok.toLocaleString()} sequential passes`, color: 'var(--accent-pink)' },
            { label: 'Per-token GPU effort', value: `~${Math.round(PREFILL_RATE / DECODE_RATE)}×`, note: 'output vs input, single stream' },
          ]} />
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 14 }}>
        {inTok.toLocaleString()} tokens absorbed in {fmt(ttft)}; {outTok.toLocaleString()} written
        in {fmt(gen)} — reading is parallel, writing is word by word.
      </div>
      <More label="Why the bill only shows 3–8×">
        Batching lets providers share each decode pass across many customers, which compresses the
        raw ~{Math.round(PREFILL_RATE / DECODE_RATE)}× per-token effort gap down to the 3–8× you
        see on price lists.
      </More>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Cost asymmetry explorer (the meter view)                            */
/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/* Output/input price ratios across the market                        */
/* ------------------------------------------------------------------ */
function RatioChart() {
  const rows = MODEL_PRICES
    .map((m) => ({ name: m.name, ratio: m.output / m.input }))
    .sort((a, b) => b.ratio - a.ratio)
  const max = Math.max(...rows.map((r) => r.ratio))
  return (
    <div className="panel">
      {rows.map((r) => (
        <div className="bar-row" key={r.name}>
          <div className="bar-label">{r.name}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{
              width: `${(r.ratio / max) * 100}%`,
              background: r.ratio >= 4 ? 'var(--accent-pink)' : r.ratio > 1 ? 'var(--accent-violet)' : 'var(--accent-green)',
            }}>
              <span className="bar-value">{r.ratio.toFixed(1)}×</span>
            </div>
          </div>
        </div>
      ))}
      <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 10 }}>
        Output ÷ input list price, per model — virtually the whole market sits at 2–6×.
      </div>
      <More>
        The physics of decode shows through every vendor’s tariff (prices from Module 03). Where
        the ratio is 1× — tiny open models — tokens are so cheap the meter barely matters.
      </More>
    </div>
  )
}

/* ------------------------------------------------------------------ */
export default function PrefillDecode() {
  return (
    <Section
      id="prefill"
      kicker="Module 02 · The two phases of inference"
      title="Prefill vs decode: why output tokens cost 3–8× more"
      lede={
        <>
          Every API call you just built in Module 01 runs in two very different phases.{' '}
          <strong>Prefill</strong> reads your whole context in one parallel pass — the GPU crunches
          thousands of tokens simultaneously. <strong>Decode</strong> then generates the answer one
          token at a time, re-reading every model weight for each one. That single asymmetry
          explains the most misunderstood line on every LLM invoice.
        </>
      }
    >
      <Block
        title="The four stages of a request"
        sub="Prefill is parallel and cheap. Decoding is sequential and expensive. Press play."
      >
        <PipelineAnimation />
      </Block>

      <Block
        title="Feel the speed gap"
        sub="Drag the sliders — watch where a request’s wall-clock time (and GPU effort) actually goes."
      >
        <PhaseRace />
      </Block>

      <Block title="Two physical regimes, two lines on the invoice">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
          <div className="card" style={{ borderColor: 'rgba(56,209,224,0.5)' }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-cyan)', fontWeight: 700 }}>Prefill · input tokens</div>
            <div className="big-num" style={{ color: 'var(--accent-cyan)', fontSize: 24, margin: '6px 0' }}>compute-bound</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>All tokens processed together in giant matrix multiplications — each one is cheap.</div>
          </div>
          <div className="card" style={{ borderColor: 'rgba(244,114,182,0.5)' }}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-pink)', fontWeight: 700 }}>Decode · output tokens</div>
            <div className="big-num" style={{ color: 'var(--accent-pink)', fontSize: 24, margin: '6px 0' }}>memory-bound</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>Each token streams all ~140 GB of weights from memory — and N+1 can’t start before N exists.</div>
          </div>
        </div>
        <More label="Why this is not marketing">
          The two phases run in genuinely different physical regimes on the same GPU: prefill
          saturates the arithmetic units, decode starves them behind memory bandwidth. Different
          bottlenecks mean different unit costs — which is why every provider meters input and
          output separately.
        </More>
      </Block>

      <Block title="What the meter says" sub="The same asymmetry in dollars: shape a request and watch which side dominates.">
        <AsymmetryExplorer />
      </Block>

      <Block title="Proof across the market" sub="Every provider prices the two phases apart — because the physics is the same for everyone.">
        <RatioChart />
      </Block>

      <Callout tone="green" title="The same physics makes the discounts honest">
        Stable prompt prefixes let providers <strong>skip prefill entirely</strong> (~90% off cached
        input); shareable decode passes are why <strong>batch APIs run at 50% off</strong>.
        <More label="The mechanics">
          Prefill’s job is to build the KV cache — the attention state for every context token. If
          your prefix is stable (system prompt, tool schemas, documents), that cache is kept warm in
          GPU memory and reused. And because decode cost is dominated by weight-reads that can be
          shared across customers, batching monetises idle capacity. Module 04 builds the full cost
          model on these foundations.
        </More>
      </Callout>

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
