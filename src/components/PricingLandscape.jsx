import React, { useState } from 'react'
import { Section, Fold, Seg, Hint, More } from './ui.jsx'
import { MODEL_PRICES, TIER_COLORS, TIER_LABELS, PRICING_MODELS, LLMFLATION, fmtUSD } from '../data.js'

/* 1 — the five meters, each with its real reference points */
function Meters() {
  const [sel, setSel] = useState(null)
  return (
    <div>
      <Hint>Click any meter to see the <strong>real services</strong> those numbers come from — none of these are assumptions.</Hint>
      <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
        {PRICING_MODELS.map((p) => (
          <button
            key={p.name}
            onClick={() => setSel(sel === p.name ? null : p.name)}
            className="card"
            style={{
              cursor: 'pointer', textAlign: 'left', font: 'inherit', color: 'inherit',
              borderColor: sel === p.name ? 'var(--accent-cyan)' : undefined,
              background: sel === p.name ? 'rgba(56,209,224,0.07)' : undefined,
            }}
          >
            <div style={{ fontSize: 21 }}>{p.icon}</div>
            <div style={{ fontWeight: 700, margin: '7px 0 2px', fontSize: 13.5 }}>{p.name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--accent-cyan)' }}>{p.price}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginBottom: 7 }}>{p.unit}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{p.desc}</div>
          </button>
        ))}
      </div>
      <div className="popcard" style={{ marginTop: 12, minHeight: 76 }}>
        {sel ? (
          <>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent-cyan)', marginBottom: 8 }}>
              Where the {sel.toLowerCase()} numbers come from
            </div>
            {PRICING_MODELS.find((p) => p.name === sel).refs.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 12, fontSize: 12.5, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text)', fontWeight: 600, minWidth: 130 }}>{k}</span>
                <span style={{ color: 'var(--text-dim)' }}>{v}</span>
              </div>
            ))}
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
            In a real deployment these meters run <strong>on top of each other</strong> — a seat
            licence, plus token charges, plus tool surcharges. Click one for its sources.
          </div>
        )}
      </div>
    </div>
  )
}

/* 2 — the price ladder */
function PriceExplorer() {
  const [metric, setMetric] = useState('output')
  const [scale, setScale] = useState('log')
  const [hover, setHover] = useState(null)

  const vals = MODEL_PRICES.map((m) => m[metric])
  const max = Math.max(...vals), min = Math.min(...vals)
  const width = (v) => {
    if (scale === 'linear') return (v / max) * 100
    const lmin = Math.log10(min / 1.6), lmax = Math.log10(max)
    return ((Math.log10(v) - lmin) / (lmax - lmin)) * 100
  }
  const spread = Math.round(max / min)

  return (
    <div className="panel">
      <div className="chart-title">The price of a million tokens, across the market</div>
      <div className="chart-sub">Indicative list prices, mid-2026. These move monthly — the structure matters more than any single number.</div>
      <Hint>Switch between input and output pricing, then <strong>flip to linear scale</strong> — that is when the spread becomes visceral. Hover a bar for context.</Hint>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        <Seg options={[{ value: 'input', label: 'Input $/M' }, { value: 'output', label: 'Output $/M' }]} value={metric} onChange={setMetric} />
        <Seg options={[{ value: 'log', label: 'Log scale' }, { value: 'linear', label: 'Linear scale' }]} value={scale} onChange={setScale} />
      </div>

      {MODEL_PRICES.map((m) => (
        <div className="bar-row" key={m.name} onMouseEnter={() => setHover(m.name)} onMouseLeave={() => setHover(null)}>
          <div className="bar-label" style={{ color: hover === m.name ? 'var(--text)' : undefined }}>{m.name}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{
              width: `${width(m[metric])}%`,
              background: TIER_COLORS[m.tier],
              opacity: hover && hover !== m.name ? 0.35 : 0.9,
            }}>
              <span className="bar-value">{fmtUSD(m[metric], 2)}</span>
            </div>
          </div>
        </div>
      ))}

      <div className="legend">
        {Object.entries(TIER_LABELS).map(([k, label]) => (
          <div className="legend-item" key={k}>
            <div className="legend-dot" style={{ background: TIER_COLORS[k] }} />{label}
          </div>
        ))}
      </div>

      <div style={{ minHeight: 38, marginTop: 12, fontSize: 12.5, color: 'var(--text-dim)' }}>
        {hover
          ? <><strong style={{ color: 'var(--text)' }}>{hover}:</strong> {MODEL_PRICES.find((m) => m.name === hover)?.notes}</>
          : <>Spread on this metric: <strong style={{ color: 'var(--accent-pink)' }}>{spread}×</strong> between the most and least expensive tier.</>}
      </div>
    </div>
  )
}

/* 3 — LLMflation, now interactive */
function LLMflationChart() {
  const [sel, setSel] = useState(null)
  const W = 640, H = 265, pad = 52
  const logMin = Math.log10(0.1), logMax = Math.log10(30)
  const x = (i) => pad + (i / (LLMFLATION.length - 1)) * (W - 2 * pad)
  const y = (p) => H - pad - ((Math.log10(p) - logMin) / (logMax - logMin)) * (H - 2 * pad)
  const path = LLMFLATION.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.price)}`).join(' ')
  const cur = LLMFLATION.find((d) => d.year === sel)
  const total = (LLMFLATION[0].price / LLMFLATION[LLMFLATION.length - 1].price).toFixed(0)

  return (
    <div className="panel">
      <div className="chart-title">What GPT-4-class intelligence has cost, 2022 → 2026</div>
      <div className="chart-sub">
        Same capability bar, falling price. ~{total}× cheaper over four years — about {Math.pow(50, 1 / 4).toFixed(1)}× per year compounded.
      </div>
      <Hint>Click any point on the line to see what that price actually bought, and how the number was arrived at.</Hint>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {[20, 10, 5, 2, 1, 0.5, 0.2].map((g) => (
          <g key={g}>
            <line x1={pad} y1={y(g)} x2={W - pad} y2={y(g)} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 5" />
            <text x={pad - 8} y={y(g) + 4} fill="var(--text-faint)" fontSize="10" textAnchor="end" fontFamily="var(--mono)">${g}</text>
          </g>
        ))}
        <defs>
          <linearGradient id="flation" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent-pink)" />
            <stop offset="100%" stopColor="var(--accent-cyan)" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="url(#flation)" strokeWidth="3.5" strokeLinecap="round" />
        {LLMFLATION.map((d, i) => {
          const on = sel === d.year
          return (
            <g key={d.year} onClick={() => setSel(on ? null : d.year)} style={{ cursor: 'pointer' }}>
              <circle cx={x(i)} cy={y(d.price)} r="14" fill="transparent" />
              <circle cx={x(i)} cy={y(d.price)} r={on ? 8 : 5.5} fill={on ? 'var(--accent-cyan)' : 'var(--bg)'}
                stroke="var(--accent-cyan)" strokeWidth="2.5" style={{ transition: 'all 0.2s' }} />
              <text x={x(i)} y={y(d.price) - 16} fill={on ? 'var(--accent-cyan)' : 'var(--text)'} fontSize="11.5" textAnchor="middle" fontFamily="var(--mono)" fontWeight={on ? 700 : 400}>
                {d.label}
              </text>
              <text x={x(i)} y={H - pad + 20} fill={on ? 'var(--accent-cyan)' : 'var(--text-faint)'} fontSize="11" textAnchor="middle" fontFamily="var(--mono)">
                {d.year}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="popcard" style={{ marginTop: 8, minHeight: 74 }}>
        {cur ? (
          <>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 700, color: 'var(--accent-cyan)' }}>{cur.label}</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{cur.year} — {cur.what}</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{cur.detail}</div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
            The y-axis is price per million tokens for a <strong>fixed capability level</strong> —
            not for the newest model. Click a year for the detail.
          </div>
        )}
      </div>
      <More label="What drives the decline">
        Four multiplicative layers stack: hardware generations (4–15× each), model architecture
        (MoE, distillation, quantisation), serving software (batching, paged KV caches, speculative
        decoding), and open-weight competition putting a ceiling on every matched tier. Module 4.1
        quantifies each one.
      </More>
    </div>
  )
}

export default function PricingLandscape() {
  return (
    <Section
      id="pricing"
      kicker="Module 2.1 · The pricing landscape"
      title="Which meter is running?"
      lede={
        <>
          The commercial menu spans five distinct pricing models, usually layered on top of each
          other in a real deployment. Knowing <strong>which meter is running</strong> — per seat,
          per token, per call, per hour, or per training run — is the first step of any cost review.
        </>
      }
    >
      <Fold title="The five commercial meters" sub="What you can be charged for, and the real services behind each range." open>
        <Meters />
      </Fold>

      <Fold title="The price ladder" sub="Ten representative tiers, from frontier reasoning to small open models.">
        <PriceExplorer />
      </Fold>

      <Fold title="LLMflation — the trend underneath it all" sub="What a fixed capability level has cost over four years.">
        <LLMflationChart />
      </Fold>
    </Section>
  )
}
