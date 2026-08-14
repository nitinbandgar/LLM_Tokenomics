import React, { useEffect, useRef, useState } from 'react'
import { Section, Fold, Slider, ResultStrip, Callout, Hint, More } from './ui.jsx'
import { MODEL_PRICES, fmtUSD } from '../data.js'

/* ------------------------------------------------------------------ */
/* 1 · The four stages — decode (GPU computes) vs stream (you receive) */
/* ------------------------------------------------------------------ */
const N_IN = 24
const N_OUT = 12
const WORDS = ['Enterprise', ' LLM', ' bills', ' rise', ' because', ' agents', ' resend', ' context', ' on', ' every', ' step', '.']

function PipelineAnimation() {
  const [phase, setPhase] = useState('idle') // idle | tokenize | prefill | decode | stream | done
  const [computed, setComputed] = useState(0) // tokens the GPU has produced
  const [shown, setShown] = useState(0) // tokens delivered to the screen
  const timers = useRef([])
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }

  const play = () => {
    clearTimers()
    setPhase('tokenize'); setComputed(0); setShown(0)
    timers.current.push(setTimeout(() => setPhase('prefill'), 900))
    timers.current.push(setTimeout(() => setPhase('decode'), 2000))
    for (let i = 1; i <= N_OUT; i++) {
      timers.current.push(setTimeout(() => setComputed(i), 2000 + i * 320))
      // streaming trails decoding by a beat — a token is sent the moment it exists
      timers.current.push(setTimeout(() => { setPhase('stream'); setShown(i) }, 2000 + i * 320 + 160))
    }
    timers.current.push(setTimeout(() => setPhase('done'), 2000 + N_OUT * 320 + 700))
  }
  useEffect(() => clearTimers, [])

  const active = (name) => phase === name || (name === 'decode' && phase === 'stream')
  const stageStyle = (name) => ({
    padding: '9px 12px', borderRadius: 10, flex: 1, textAlign: 'center', fontSize: 12.5, fontWeight: 600,
    border: `1px solid ${active(name) ? 'var(--accent-cyan)' : 'var(--border)'}`,
    background: active(name) ? 'rgba(56,209,224,0.08)' : 'var(--card)',
    color: active(name) ? 'var(--accent-cyan)' : 'var(--text-dim)',
    transition: 'all 0.25s',
  })

  return (
    <div className="panel">
      <Hint>Press <strong>Run a request</strong>. Watch stage 3 (the GPU making tokens) stay one step ahead of stage 4 (those tokens reaching your screen).</Hint>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={stageStyle('tokenize')}>1 · Tokenize</div>
        <div style={stageStyle('prefill')}>2 · Prefill <span style={{ fontWeight: 400 }}>(all at once)</span></div>
        <div style={stageStyle('decode')}>3 · Decode <span style={{ fontWeight: 400 }}>(GPU makes each token)</span></div>
        <div style={stageStyle('stream')}>4 · Stream <span style={{ fontWeight: 400 }}>(you receive it)</span></div>
      </div>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--accent-cyan)', marginBottom: 8, fontFamily: 'var(--mono)' }}>
            INPUT — {N_IN} tokens · ONE parallel pass
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 16px)', gap: 5 }}>
            {Array.from({ length: N_IN }).map((_, i) => (
              <div key={i} className={'pipe-cell' + (phase !== 'idle' && phase !== 'tokenize' ? ' lit-in' : '')} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>Compute-bound · fast and cheap</div>
        </div>

        <div>
          <div style={{ fontSize: 11.5, color: 'var(--accent-pink)', marginBottom: 8, fontFamily: 'var(--mono)' }}>
            STAGE 3 · GPU WORK — {computed}/{N_OUT} computed
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 16px)', gap: 5 }}>
            {Array.from({ length: N_OUT }).map((_, i) => (
              <div key={i} className={'pipe-cell ' + (i < computed ? 'lit-out' : phase === 'decode' || phase === 'stream' ? 'pending-out' : '')} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>Memory-bound · one full weight read each</div>
        </div>
      </div>

      {/* Stage 4 gets a visually distinct treatment: text arriving on a screen */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11.5, color: 'var(--accent-green)', marginBottom: 6, fontFamily: 'var(--mono)' }}>
          STAGE 4 · WHAT THE USER SEES — {shown}/{N_OUT} delivered
        </div>
        <div style={{
          border: '1px solid var(--border-bright)', borderRadius: 10, padding: '12px 14px',
          background: 'var(--bg)', minHeight: 52, fontSize: 14.5, lineHeight: 1.6,
        }}>
          {shown === 0 && phase !== 'done'
            ? <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>Nothing yet — the GPU has to make a token before it can be sent.</span>
            : WORDS.slice(0, shown).map((w, i) => (
                <span key={i} style={{ color: 'var(--text)', animation: 'tokenIn 0.25s both' }}>{w}</span>
              ))}
          {(phase === 'decode' || phase === 'stream') && <span style={{ color: 'var(--accent-cyan)' }}>▊</span>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, flexWrap: 'wrap' }}>
        <button className="btn primary" onClick={play}>{phase === 'idle' ? '▶ Run a request' : '↻ Replay'}</button>
        <div style={{ fontSize: 12.5, color: 'var(--text-dim)', flex: '1 1 260px' }}>
          {phase === 'idle' && 'Follow one request through the serving stack.'}
          {phase === 'tokenize' && 'Splitting the prompt into tokens…'}
          {phase === 'prefill' && 'Prefill: the whole prompt computed together — one pass, cheap.'}
          {(phase === 'decode' || phase === 'stream') && `Decode makes token ${computed}; streaming delivers it. The GPU stays one step ahead of your screen.`}
          {phase === 'done' && 'Done. 24 input tokens took one pass; 12 output tokens took 12 passes — each sent the instant it existed.'}
        </div>
      </div>
      <More label="So what is the difference between decode and stream?">
        <strong>Decode is the expensive part</strong> — the GPU runs the whole model again for every
        token, and that is what you are billed for. <strong>Streaming is only delivery</strong> —
        sending each token to your screen the moment it exists, so you see words appear instead of
        waiting for the whole answer. Streaming costs nothing extra; it changes when you see what
        you have already paid for.
      </More>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2 · Speed, GPU time and cost in one place                           */
/* ------------------------------------------------------------------ */
const PREFILL_RATE = 20000 // tok/s ingested
const DECODE_RATE = 60 // tok/s generated
const NODE_HOURLY = 20 // $/hr for an 8× H100 node

function PhaseEconomics() {
  const [inTok, setInTok] = useState(10000)
  const [outTok, setOutTok] = useState(500)

  const ttft = inTok / PREFILL_RATE
  const gen = outTok / DECODE_RATE
  const total = ttft + gen
  const fmtT = (s) => (s < 1 ? `${(s * 1000).toFixed(0)} ms` : `${s.toFixed(1)} s`)
  const gpuCostIn = (ttft / 3600) * NODE_HOURLY
  const gpuCostOut = (gen / 3600) * NODE_HOURLY
  const outShareTime = (gen / total) * 100

  return (
    <div className="panel">
      <Hint>Drag the two sliders. The bar shows where the <strong>time</strong> goes; the cards show where the <strong>GPU cost</strong> goes.</Hint>
      <div className="grid grid-2" style={{ gap: 28 }}>
        <div>
          <Slider label="Input tokens (the whole context)" value={inTok} min={500} max={100000} step={500}
            display={inTok.toLocaleString()} onChange={setInTok} />
          <Slider label="Output tokens (the response)" value={outTok} min={20} max={2000} step={20}
            display={outTok.toLocaleString()} onChange={setOutTok} />

          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '14px 0 6px' }}>
            Where the time goes
          </div>
          <div style={{ display: 'flex', height: 34, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-bright)' }}>
            <div style={{ width: `${Math.max(1.5, (ttft / total) * 100)}%`, background: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0b0e17', transition: 'width 0.25s', minWidth: 3 }}>
              {(ttft / total) > 0.14 ? 'prefill' : ''}
            </div>
            <div style={{ width: `${outShareTime}%`, background: 'var(--accent-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0b0e17', transition: 'width 0.25s' }}>
              {outShareTime > 14 ? 'decode' : ''}
            </div>
          </div>
          <ResultStrip items={[
            { label: 'Time to first token', value: fmtT(ttft), color: 'var(--accent-cyan)' },
            { label: 'Time writing the answer', value: fmtT(gen), color: 'var(--accent-pink)' },
            { label: 'Decode’s share of the wait', value: `${Math.round(outShareTime)}%` },
          ]} />
        </div>

        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Two physical regimes → two prices
          </div>
          <div className="card" style={{ borderColor: 'rgba(56,209,224,0.5)', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                📖 Reading · prefill
              </span>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>{fmtUSD(gpuCostIn, 4)}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 5 }}>
              <strong>Compute-bound.</strong> All {inTok.toLocaleString()} tokens crunched together —
              {' '}{fmtT(ttft)} of GPU time covers the lot.
            </div>
          </div>
          <div className="card" style={{ borderColor: 'rgba(244,114,182,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-pink)', fontWeight: 700 }}>
                ✍️ Writing · decode
              </span>
              <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent-pink)', fontWeight: 700 }}>{fmtUSD(gpuCostOut, 4)}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 5 }}>
              <strong>Memory-bound.</strong> Each of the {outTok.toLocaleString()} tokens needs its own
              pass over ~140 GB of weights — and token N+1 cannot start before N exists.
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 12 }}>
            Same GPU, same ${NODE_HOURLY}/hour — but writing takes{' '}
            <strong style={{ color: 'var(--accent-pink)' }}>{(gpuCostOut / Math.max(gpuCostIn, 1e-9)).toFixed(0)}× more GPU time</strong>{' '}
            than reading here. That is why there are two lines on your invoice.
          </div>
        </div>
      </div>
      <More label="Why your bill shows 3–8×, not 300×">
        Providers batch many customers into each decode pass, spreading that expensive weight-read
        across dozens of requests. Batching is what compresses the raw per-token effort gap down to
        the 3–8× you actually see on price lists.
      </More>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3 · Your meter and the market's, side by side                       */
/* ------------------------------------------------------------------ */
function MeterAndMarket() {
  const [inTok, setInTok] = useState(2000)
  const [outTok, setOutTok] = useState(500)
  const inCost = (inTok / 1e6) * 3
  const outCost = (outTok / 1e6) * 15
  const total = inCost + outCost
  const maxBar = Math.max(inCost, outCost, 1e-9)

  const rows = MODEL_PRICES.map((m) => ({ name: m.name, ratio: m.output / m.input })).sort((a, b) => b.ratio - a.ratio)
  const maxRatio = Math.max(...rows.map((r) => r.ratio))

  return (
    <div className="panel">
      <Hint>Left: shape a request and see your own split. Right: every provider prices the same way — this is physics, not vendor policy.</Hint>
      <div className="grid grid-2" style={{ gap: 30 }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Your request
          </div>
          <Slider label="Input tokens" value={inTok} min={100} max={20000} step={100} display={inTok.toLocaleString()} onChange={setInTok} />
          <Slider label="Output tokens" value={outTok} min={50} max={5000} step={50} display={outTok.toLocaleString()} onChange={setOutTok} />
          <div className="bar-row">
            <div className="bar-label" style={{ width: 90 }}>Input cost</div>
            <div className="bar-track" style={{ height: 20 }}>
              <div className="bar-fill" style={{ width: `${(inCost / maxBar) * 100}%`, background: 'var(--accent-cyan)' }}>
                <span className="bar-value">{fmtUSD(inCost, 5)}</span>
              </div>
            </div>
          </div>
          <div className="bar-row">
            <div className="bar-label" style={{ width: 90 }}>Output cost</div>
            <div className="bar-track" style={{ height: 20 }}>
              <div className="bar-fill" style={{ width: `${(outCost / maxBar) * 100}%`, background: 'var(--accent-pink)' }}>
                <span className="bar-value">{fmtUSD(outCost, 5)}</span>
              </div>
            </div>
          </div>
          <ResultStrip items={[
            { label: 'This request', value: fmtUSD(total, 5) },
            { label: '× 100K / month', value: fmtUSD(total * 100000), note: 'the enterprise view' },
            { label: 'Output share', value: `${Math.round((outCost / total) * 100)}%`, color: 'var(--accent-pink)' },
          ]} />
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 6 }}>Priced at $3/M in · $15/M out.</div>
        </div>

        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Output ÷ input price, by model
          </div>
          {rows.map((r) => (
            <div className="bar-row" key={r.name}>
              <div className="bar-label" style={{ width: 140, fontSize: 11.5 }}>{r.name}</div>
              <div className="bar-track" style={{ height: 17 }}>
                <div className="bar-fill" style={{
                  width: `${(r.ratio / maxRatio) * 100}%`,
                  background: r.ratio >= 4 ? 'var(--accent-pink)' : r.ratio > 1 ? 'var(--accent-violet)' : 'var(--accent-green)',
                }}>
                  <span className="bar-value">{r.ratio.toFixed(1)}×</span>
                </div>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
            Virtually the whole market sits at <strong>2–6×</strong>. Where it is 1×, tokens are so
            cheap the meter barely matters.
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
export default function PrefillDecode() {
  return (
    <Section
      id="prefill"
      kicker="Module 02 · The two phases of inference"
      title="Why writing costs more than reading"
      lede={
        <>
          Every API call runs in two very different phases. <strong>Reading</strong> your context
          happens all at once. <strong>Writing</strong> the answer happens one token at a time, each
          costing a full pass over the model. That asymmetry explains the most misunderstood line
          on your invoice.
        </>
      }
    >
      <Fold open title="Follow one request" sub="Four stages — including the difference between the GPU making a token and you receiving it." sub="Four stages — including the difference between the GPU making a token and you receiving it.">
        <PipelineAnimation />
      </Fold>

      <Fold title="Time, GPU cost, and why there are two prices" sub="The same request measured three ways." badge="calculator" sub="The same request measured three ways.">
        <PhaseEconomics />
      </Fold>

      <Fold title="What it means on the invoice" sub="Your meter on the left; the whole market on the right." badge="calculator" sub="Your meter on the left; the whole market on the right.">
        <MeterAndMarket />
      </Fold>

      <Callout tone="green" title="The same physics makes the discounts honest">
        Stable prompt prefixes let providers <strong>skip reading entirely</strong> (~90% off cached
        input); shareable writing passes are why <strong>batch lanes run at 50% off</strong>.
        <More label="The mechanics">
          Prefill’s job is to build the KV cache — the attention state for every context token. If
          your prefix is stable (system prompt, tool schemas, documents), that cache is kept warm
          and reused. And because decode cost is dominated by weight-reads that can be shared across
          customers, batching monetises idle capacity. Module 05 builds the full cost model.
        </More>
      </Callout>
    </Section>
  )
}
